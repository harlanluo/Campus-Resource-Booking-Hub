package com.campusbooking.service;

import com.campusbooking.dto.KitBookingRequestDTO;
import com.campusbooking.dto.KitBookingResponseDTO;
import com.campusbooking.exception.BookingConflictException;
import com.campusbooking.model.Booking;
import com.campusbooking.model.Kit;
import com.campusbooking.model.KitBooking;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.KitBookingRepository;
import com.campusbooking.repository.KitRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

/** Transaction boundary and lifecycle owner for first-class Project Kit reservations. */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KitBookingService {

    private final KitBookingRepository kitBookingRepository;
    private final KitRepository kitRepository;
    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final WaitlistService waitlistService;

    @Transactional
    public KitBookingResponseDTO create(Long kitId, KitBookingRequestDTO request) {
        User owner = userRepository.findById(request.getUserId())
                .orElseThrow(() -> notFound("User", request.getUserId()));
        Kit kit = kitRepository.findByIdWithResources(kitId)
                .orElseThrow(() -> notFound("Kit", kitId));
        if (kit.getResources() == null || kit.getResources().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Kit '" + kit.getName() + "' contains no bundled resources.");
        }

        LocalDateTime now = LocalDateTime.now();
        validateFutureInterval(request.getStartTime(), request.getEndTime(), now);
        Set<User> members = resolveMembers(owner, request);
        List<Resource> resources = kit.getResources().stream()
                .sorted(Comparator.comparing(Resource::getId))
                .toList();
        List<Long> resourceIds = resources.stream().map(Resource::getId).toList();
        List<Resource> lockedResources = resourceRepository.findAllByIdForUpdate(resourceIds);
        if (lockedResources.size() != resourceIds.size()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "One or more resources in this Kit no longer exist.");
        }

        for (Resource resource : resources) {
            waitlistService.processExpiredOffersForResource(resource.getId(), now);
            if (resource.getStatus() != Resource.Status.AVAILABLE) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Resource '" + resource.getName() + "' in kit is not available (current status: "
                                + resource.getStatus() + ").");
            }
            if (!bookingRepository.findOverlappingBookings(
                    resource.getId(), request.getStartTime(), request.getEndTime()).isEmpty()) {
                throw new BookingConflictException(
                        "Resource '" + resource.getName() + "' in kit is already booked during this time slot.");
            }
            if (waitlistService.hasActiveOfferConflict(
                    resource.getId(), request.getStartTime(), request.getEndTime(), now)) {
                throw new BookingConflictException(
                        "Resource '" + resource.getName() + "' in kit is temporarily held for a slot offer.");
            }
        }

        KitBooking parent = KitBooking.builder()
                .kit(kit)
                .user(owner)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(KitBooking.Status.PENDING)
                .resourceCount(resources.size())
                .groupMembers(members)
                .build();
        KitBooking savedParent = kitBookingRepository.saveAndFlush(parent);
        savedParent.setBookingReference("KIT-" + savedParent.getCreatedAt().getYear() + "-"
                + String.format(Locale.ROOT, "%06d", savedParent.getId()));
        kitBookingRepository.save(savedParent);

        List<Booking> children = resources.stream()
                .map(resource -> Booking.builder()
                        .user(owner)
                        .resource(resource)
                        .kitBooking(savedParent)
                        .startTime(request.getStartTime())
                        .endTime(request.getEndTime())
                        .status(Booking.Status.PENDING)
                        .build())
                .toList();
        List<Booking> savedChildren = bookingRepository.saveAll(children);
        log.info("[Kit Booking] Created {} for user {} with {} resource holds.",
                savedParent.getBookingReference(), owner.getUsername(), savedChildren.size());
        return KitBookingResponseDTO.from(savedParent, savedChildren, now);
    }

    public List<KitBookingResponseDTO> getUserActive(Long userId) {
        requireUser(userId);
        LocalDateTime now = LocalDateTime.now();
        return kitBookingRepository.findActiveForUser(userId, now).stream()
                .map(parent -> toResponse(parent, now))
                .toList();
    }

    public List<KitBookingResponseDTO> getUserHistory(Long userId) {
        requireUser(userId);
        LocalDateTime now = LocalDateTime.now();
        return kitBookingRepository.findHistoryForUser(userId, now).stream()
                .map(parent -> toResponse(parent, now))
                .toList();
    }

    public List<KitBookingResponseDTO> getAdminActive() {
        LocalDateTime now = LocalDateTime.now();
        return kitBookingRepository.findActiveForAdmin(now).stream()
                .map(parent -> toResponse(parent, now))
                .toList();
    }

    public String getReference(Long id) {
        return kitBookingRepository.findById(id)
                .map(KitBooking::getBookingReference)
                .orElseThrow(() -> notFound("Kit booking", id));
    }

    @Transactional
    public KitBookingResponseDTO approve(Long id) {
        KitBooking parent = lockParent(id);
        LocalDateTime now = LocalDateTime.now();
        requirePendingFuture(parent, now, KitBooking.Status.APPROVED);
        List<Booking> children = validateChildren(parent, Booking.Status.PENDING);
        parent.setStatus(KitBooking.Status.APPROVED);
        children.forEach(child -> child.setStatus(Booking.Status.APPROVED));
        bookingRepository.saveAll(children);
        kitBookingRepository.save(parent);
        return KitBookingResponseDTO.from(parent, children, now);
    }

    @Transactional
    public KitBookingResponseDTO reject(Long id) {
        KitBooking parent = lockParent(id);
        LocalDateTime now = LocalDateTime.now();
        requirePendingFuture(parent, now, KitBooking.Status.REJECTED);
        List<Booking> children = validateChildren(parent, Booking.Status.PENDING);
        lockChildResources(children);
        parent.setStatus(KitBooking.Status.REJECTED);
        children.forEach(child -> child.setStatus(Booking.Status.REJECTED));
        bookingRepository.saveAll(children);
        kitBookingRepository.save(parent);
        bookingRepository.flush();
        offerReleasedChildren(children);
        return KitBookingResponseDTO.from(parent, children, now);
    }

    @Transactional
    public KitBookingResponseDTO cancel(Long id) {
        KitBooking parent = lockParent(id);
        LocalDateTime now = LocalDateTime.now();
        if (parent.getStatus() != KitBooking.Status.PENDING
                && parent.getStatus() != KitBooking.Status.APPROVED) {
            throw invalidTransition(parent, KitBooking.Status.CANCELLED);
        }
        if (isEffectivelyCompleted(parent, now)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Completed Kit reservations cannot be cancelled.");
        }
        if (!parent.getStartTime().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Kit reservations cannot be cancelled after they have started.");
        }
        Booking.Status expected = parent.getStatus() == KitBooking.Status.PENDING
                ? Booking.Status.PENDING : Booking.Status.APPROVED;
        List<Booking> children = validateChildren(parent, expected);
        lockChildResources(children);
        parent.setStatus(KitBooking.Status.CANCELLED);
        children.forEach(child -> child.setStatus(Booking.Status.CANCELLED));
        bookingRepository.saveAll(children);
        kitBookingRepository.save(parent);
        bookingRepository.flush();
        offerReleasedChildren(children);
        return KitBookingResponseDTO.from(parent, children, now);
    }

    private KitBookingResponseDTO toResponse(KitBooking parent, LocalDateTime now) {
        return KitBookingResponseDTO.from(parent,
                bookingRepository.findByKitBookingIdOrderByResourceId(parent.getId()), now);
    }

    private KitBooking lockParent(Long id) {
        return kitBookingRepository.findByIdForUpdate(id)
                .orElseThrow(() -> notFound("Kit booking", id));
    }

    private List<Booking> validateChildren(KitBooking parent, Booking.Status expectedStatus) {
        List<Booking> children = bookingRepository.findByKitBookingIdOrderByResourceId(parent.getId());
        if (children.isEmpty() || children.size() != parent.getResourceCount()
                || children.stream().anyMatch(child -> child.getKitBooking() == null
                        || !parent.getId().equals(child.getKitBooking().getId())
                        || !parent.getUser().getId().equals(child.getUser().getId())
                        || !parent.getStartTime().equals(child.getStartTime())
                        || !parent.getEndTime().equals(child.getEndTime())
                        || child.getStatus() != expectedStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Kit reservation child records are incomplete or out of sync.");
        }
        return children;
    }

    private void lockChildResources(List<Booking> children) {
        List<Long> ids = children.stream().map(child -> child.getResource().getId()).sorted().toList();
        if (resourceRepository.findAllByIdForUpdate(ids).size() != ids.size()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A resource belonging to this Kit reservation no longer exists.");
        }
    }

    private void offerReleasedChildren(List<Booking> children) {
        children.stream()
                .sorted(Comparator.comparing(child -> child.getResource().getId()))
                .forEach(child -> waitlistService.offerReleasedSlot(
                        child.getResource(), child.getStartTime(), child.getEndTime()));
    }

    private void requirePendingFuture(
            KitBooking parent, LocalDateTime now, KitBooking.Status target) {
        if (isEffectivelyCompleted(parent, now)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Completed Kit reservations cannot be changed.");
        }
        if (!parent.getEndTime().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Expired Kit booking requests cannot be changed.");
        }
        if (parent.getStatus() != KitBooking.Status.PENDING) {
            throw invalidTransition(parent, target);
        }
    }

    private boolean isEffectivelyCompleted(KitBooking parent, LocalDateTime now) {
        return parent.getStatus() == KitBooking.Status.COMPLETED
                || (parent.getStatus() == KitBooking.Status.APPROVED
                    && !parent.getEndTime().isAfter(now));
    }

    private void validateFutureInterval(
            LocalDateTime start, LocalDateTime end, LocalDateTime now) {
        if (!start.isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "startTime must be in the future.");
        }
        if (!end.isAfter(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "endTime must be strictly after startTime.");
        }
    }

    private Set<User> resolveMembers(User owner, KitBookingRequestDTO request) {
        Set<User> members = new HashSet<>();
        if (request.getMemberUserIds() != null) {
            for (Long memberId : request.getMemberUserIds()) {
                if (memberId != null && !memberId.equals(owner.getId())) {
                    members.add(userRepository.findById(memberId)
                            .orElseThrow(() -> notFound("Group member", memberId)));
                }
            }
        }
        if (request.getMemberUsernames() != null) {
            for (String username : request.getMemberUsernames()) {
                if (username != null && !username.isBlank()
                        && !username.equalsIgnoreCase(owner.getUsername())) {
                    String normalized = username.trim();
                    members.add(userRepository.findByUsername(normalized)
                            .orElseThrow(() -> new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Group member not found with username: " + normalized)));
                }
            }
        }
        return members;
    }

    private void requireUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw notFound("User", id);
        }
    }

    private ResponseStatusException invalidTransition(
            KitBooking parent, KitBooking.Status target) {
        return new ResponseStatusException(HttpStatus.CONFLICT,
                "Cannot change Kit booking " + parent.getBookingReference() + " from "
                        + parent.getStatus() + " to " + target + ".");
    }

    private ResponseStatusException notFound(String type, Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND,
                type + " not found with id: " + id);
    }
}
