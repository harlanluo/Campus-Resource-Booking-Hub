package com.campusbooking.service;

import com.campusbooking.dto.BookingResponseDTO;
import com.campusbooking.dto.WaitlistAdminOverviewDTO;
import com.campusbooking.dto.WaitlistRequestDTO;
import com.campusbooking.dto.WaitlistResponseDTO;
import com.campusbooking.model.Booking;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.model.Waitlist;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
import com.campusbooking.repository.WaitlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Slot-aware FIFO waitlist and temporary-offer workflow. */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WaitlistService {

    private final WaitlistRepository waitlistRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;

    @Value("${campus.waitlist.offer-duration-minutes:15}")
    private long offerDurationMinutes;

    @Transactional
    public WaitlistResponseDTO joinWaitlist(String username, WaitlistRequestDTO request) {
        User user = requireStudent(username);
        validateInterval(request.getStartTime(), request.getEndTime());

        Resource resource = resourceRepository.findByIdForUpdate(request.getResourceId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Resource not found with id: " + request.getResourceId()));
        requireBookable(resource);

        LocalDateTime now = LocalDateTime.now();
        reevaluateExpiredOfferIntervalsLocked(resource, expireOffersForResourceLocked(resource, now), now);

        if (waitlistRepository.existsActiveExactRequest(
                user.getId(), resource.getId(), request.getStartTime(), request.getEndTime())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "You already have an active waitlist request for this exact time.");
        }
        if (bookingRepository.findOverlappingBookings(
                resource.getId(), request.getStartTime(), request.getEndTime()).isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This exact time is available and can be booked normally.");
        }

        Waitlist saved = waitlistRepository.save(Waitlist.builder()
                .user(user)
                .resource(resource)
                .requestedStart(request.getStartTime())
                .requestedEnd(request.getEndTime())
                .status(Waitlist.Status.WAITING)
                .build());
        return toResponse(saved);
    }

    @Transactional
    public List<WaitlistResponseDTO> getOwnActiveEntries(String username) {
        User user = requireUser(username);
        refreshOwnActiveEntries(user);
        return activeEntries(user.getId()).stream().map(this::toResponse).toList();
    }

    @Transactional
    public List<WaitlistResponseDTO> getOwnEntries(String username) {
        User user = requireUser(username);
        refreshOwnActiveEntries(user);
        return waitlistRepository.findByUserIdOrderByRequestTimeDescIdDesc(user.getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public WaitlistResponseDTO getOwnEntry(String username, Long entryId) {
        User user = requireUser(username);
        Waitlist entry = requireOwned(entryId, user);
        LocalDateTime now = LocalDateTime.now();
        Resource resource = lockResource(entry.getResource().getId());
        reevaluateExpiredOfferIntervalsLocked(
                resource, expireOffersForResourceLocked(resource, now), now);
        return toResponse(requireOwned(entryId, user));
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public BookingResponseDTO acceptOffer(String username, Long entryId) {
        User user = requireStudent(username);
        Waitlist snapshot = waitlistRepository.findById(entryId)
                .orElseThrow(() -> notFound(entryId));
        Resource resource = resourceRepository.findByIdForUpdate(snapshot.getResource().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found."));
        Waitlist entry = requireOwnedForUpdate(entryId, user);
        LocalDateTime now = LocalDateTime.now();

        if (entry.getStatus() == Waitlist.Status.OFFERED
                && (entry.getOfferExpiresAt() == null || !entry.getOfferExpiresAt().isAfter(now))) {
            expireAndAdvanceLocked(entry, resource, now);
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This offer has expired and the slot was offered to the next eligible student.");
        }
        requireActiveOffer(entry, "accept");
        requireBookable(resource);

        if (!bookingRepository.findOverlappingBookings(
                resource.getId(), entry.getRequestedStart(), entry.getRequestedEnd()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "The slot became unavailable before this offer could be accepted.");
        }

        Booking booking = bookingRepository.save(Booking.builder()
                .user(user)
                .resource(resource)
                .startTime(entry.getRequestedStart())
                .endTime(entry.getRequestedEnd())
                .status(Booking.Status.PENDING)
                .build());
        entry.setStatus(Waitlist.Status.ACCEPTED);
        entry.setClosedAt(now);
        waitlistRepository.save(entry);
        log.info("[Waitlist Offer] User {} accepted entry {} and created PENDING booking {}.",
                user.getId(), entry.getId(), booking.getId());
        return BookingResponseDTO.from(booking);
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public WaitlistResponseDTO declineOffer(String username, Long entryId) {
        User user = requireStudent(username);
        Waitlist snapshot = waitlistRepository.findById(entryId)
                .orElseThrow(() -> notFound(entryId));
        Resource resource = resourceRepository.findByIdForUpdate(snapshot.getResource().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found."));
        Waitlist entry = requireOwnedForUpdate(entryId, user);
        LocalDateTime now = LocalDateTime.now();

        if (entry.getStatus() == Waitlist.Status.OFFERED
                && (entry.getOfferExpiresAt() == null || !entry.getOfferExpiresAt().isAfter(now))) {
            expireAndAdvanceLocked(entry, resource, now);
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This offer has already expired.");
        }
        requireActiveOffer(entry, "decline");
        entry.setStatus(Waitlist.Status.DECLINED);
        entry.setClosedAt(now);
        waitlistRepository.save(entry);
        reevaluateReleasedIntervalLocked(
                resource, entry.getRequestedStart(), entry.getRequestedEnd(), now);
        return WaitlistResponseDTO.from(entry, null);
    }

    @Transactional
    public WaitlistResponseDTO leaveWaitlist(String username, Long entryId) {
        User user = requireStudent(username);
        Waitlist snapshot = waitlistRepository.findById(entryId)
                .orElseThrow(() -> notFound(entryId));
        resourceRepository.findByIdForUpdate(snapshot.getResource().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found."));
        Waitlist entry = requireOwnedForUpdate(entryId, user);
        if (entry.getStatus() == Waitlist.Status.OFFERED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Use Decline for an active slot offer.");
        }
        if (entry.getStatus() != Waitlist.Status.WAITING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This waitlist request is already closed.");
        }
        entry.setStatus(Waitlist.Status.LEFT);
        entry.setClosedAt(LocalDateTime.now());
        return WaitlistResponseDTO.from(waitlistRepository.save(entry), null);
    }

    /** Re-evaluates waiting requests affected by a released resource interval. */
    @Transactional
    public void offerReleasedSlot(Resource releasedResource, LocalDateTime start, LocalDateTime end) {
        Resource resource = lockResource(releasedResource.getId());
        LocalDateTime now = LocalDateTime.now();
        Set<SlotWindow> releasedIntervals = expireOffersForResourceLocked(resource, now);
        releasedIntervals.add(new SlotWindow(start, end));
        reevaluateExpiredOfferIntervalsLocked(resource, releasedIntervals, now);
    }

    /** Lazy expiry boundary used by availability and booking operations. */
    @Transactional
    public void processExpiredOffersForResource(Long resourceId, LocalDateTime now) {
        Resource resource = lockResource(resourceId);
        reevaluateExpiredOfferIntervalsLocked(
                resource, expireOffersForResourceLocked(resource, now), now);
    }

    /** Expires offers only for searched resources that actually have expired offers. */
    @Transactional
    public void processExpiredOffersForResources(Collection<Long> resourceIds, LocalDateTime now) {
        if (resourceIds == null || resourceIds.isEmpty()) return;
        List<Long> expiredResourceIds = waitlistRepository.findResourceIdsWithExpiredOffers(
                resourceIds.stream().distinct().sorted().toList(), now);
        expiredResourceIds.stream().sorted().forEach(id -> processExpiredOffersForResource(id, now));
    }

    /** Returns resource IDs held by an active offer for one search interval. */
    public Set<Long> getResourceIdsWithActiveOfferConflicts(
            Collection<Long> resourceIds, LocalDateTime start, LocalDateTime end, LocalDateTime now) {
        if (resourceIds == null || resourceIds.isEmpty()) return Set.of();
        return Set.copyOf(waitlistRepository.findResourceIdsWithActiveOffersOverlapping(
                resourceIds.stream().distinct().sorted().toList(), start, end, now));
    }

    /** Returns an aggregate-only view for the read-only Admin waitlist table. */
    @Transactional
    public List<WaitlistAdminOverviewDTO> getAdminOverview() {
        LocalDateTime now = LocalDateTime.now();
        List<Waitlist.Status> activeStatuses = List.of(
                Waitlist.Status.WAITING, Waitlist.Status.OFFERED);
        List<Long> resourceIds = waitlistRepository.findByStatusInOrderBySlot(activeStatuses).stream()
                .map(entry -> entry.getResource().getId())
                .distinct()
                .sorted()
                .toList();
        for (Long resourceId : resourceIds) {
            Resource resource = lockResource(resourceId);
            reevaluateExpiredOfferIntervalsLocked(
                    resource, expireOffersForResourceLocked(resource, now), now);
        }

        Map<AdminSlotKey, List<Waitlist>> bySlot = waitlistRepository
                .findByStatusInOrderBySlot(activeStatuses).stream()
                .collect(Collectors.groupingBy(
                        entry -> new AdminSlotKey(
                                entry.getResource().getId(), entry.getResource().getName(),
                                entry.getRequestedStart(), entry.getRequestedEnd()),
                        LinkedHashMap::new,
                        Collectors.toList()));

        return bySlot.entrySet().stream().map(group -> {
            List<Waitlist> entries = group.getValue();
            Waitlist offer = entries.stream()
                    .filter(entry -> entry.getStatus() == Waitlist.Status.OFFERED)
                    .findFirst()
                    .orElse(null);
            long waitingCount = entries.stream()
                    .filter(entry -> entry.getStatus() == Waitlist.Status.WAITING)
                    .count();
            AdminSlotKey slot = group.getKey();
            return WaitlistAdminOverviewDTO.builder()
                    .resourceId(slot.resourceId())
                    .resourceName(slot.resourceName())
                    .requestedStart(slot.start())
                    .requestedEnd(slot.end())
                    .status(offer == null ? Waitlist.Status.WAITING.name() : Waitlist.Status.OFFERED.name())
                    .waitingCount(waitingCount)
                    .activeOffer(offer != null)
                    .offerExpiresAt(offer == null ? null : offer.getOfferExpiresAt())
                    .build();
        }).toList();
    }

    public boolean hasActiveOfferConflict(
            Long resourceId, LocalDateTime start, LocalDateTime end, LocalDateTime now) {
        return !waitlistRepository.findActiveOffersOverlapping(resourceId, start, end, now).isEmpty();
    }

    private Resource lockResource(Long resourceId) {
        return resourceRepository.findByIdForUpdate(resourceId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Resource not found with id: " + resourceId));
    }

    private Set<SlotWindow> expireOffersForResourceLocked(Resource resource, LocalDateTime now) {
        List<Waitlist> expired = waitlistRepository.findExpiredOffersForResource(resource.getId(), now);
        Set<SlotWindow> releasedIntervals = expired.stream()
                .map(entry -> new SlotWindow(entry.getRequestedStart(), entry.getRequestedEnd()))
                .collect(Collectors.toSet());
        expired.forEach(entry -> {
            entry.setStatus(Waitlist.Status.EXPIRED);
            entry.setClosedAt(now);
        });
        waitlistRepository.saveAll(expired);
        return releasedIntervals;
    }

    private void reevaluateExpiredOfferIntervalsLocked(
            Resource resource, Set<SlotWindow> intervals, LocalDateTime now) {
        List<SlotWindow> ordered = new ArrayList<>(intervals);
        ordered.sort(Comparator.comparing(SlotWindow::start).thenComparing(SlotWindow::end));
        ordered.forEach(interval -> reevaluateReleasedIntervalLocked(
                resource, interval.start(), interval.end(), now));
    }

    private void expireAndAdvanceLocked(Waitlist entry, Resource resource, LocalDateTime now) {
        entry.setStatus(Waitlist.Status.EXPIRED);
        entry.setClosedAt(now);
        waitlistRepository.save(entry);
        reevaluateReleasedIntervalLocked(
                resource, entry.getRequestedStart(), entry.getRequestedEnd(), now);
    }

    private void reevaluateReleasedIntervalLocked(
            Resource resource, LocalDateTime releasedStart, LocalDateTime releasedEnd,
            LocalDateTime now) {
        if (resource.getStatus() != Resource.Status.AVAILABLE) {
            return;
        }

        for (Waitlist next : waitlistRepository.findWaitingForExactReleasedSlotForUpdate(
                resource.getId(), releasedStart, releasedEnd)) {
            if (!next.getRequestedStart().isAfter(now)) {
                next.setStatus(Waitlist.Status.EXPIRED);
                next.setClosedAt(now);
                waitlistRepository.save(next);
                continue;
            }
            if (!bookingRepository.findOverlappingBookings(
                    resource.getId(), next.getRequestedStart(), next.getRequestedEnd()).isEmpty()) {
                continue;
            }
            if (!waitlistRepository.findActiveOffersOverlapping(
                    resource.getId(), next.getRequestedStart(), next.getRequestedEnd(), now).isEmpty()) {
                continue;
            }
            next.setStatus(Waitlist.Status.OFFERED);
            next.setOfferedAt(now);
            next.setOfferExpiresAt(now.plusMinutes(offerDurationMinutes));
            waitlistRepository.save(next);
            log.info("[Waitlist Offer] Entry {} offered resource {} interval {} to {} until {}.",
                    next.getId(), resource.getId(), next.getRequestedStart(),
                    next.getRequestedEnd(), next.getOfferExpiresAt());
            return;
        }
    }

    private List<Waitlist> activeEntries(Long userId) {
        return waitlistRepository.findByUserIdAndStatusInOrderByRequestedStartAscRequestTimeAscIdAsc(
                userId, List.of(Waitlist.Status.WAITING, Waitlist.Status.OFFERED));
    }

    private void refreshOwnActiveEntries(User user) {
        LocalDateTime now = LocalDateTime.now();
        List<Long> resourceIds = activeEntries(user.getId()).stream()
                .map(entry -> entry.getResource().getId())
                .distinct()
                .sorted()
                .toList();
        for (Long resourceId : resourceIds) {
            Resource resource = lockResource(resourceId);
            reevaluateExpiredOfferIntervalsLocked(
                    resource, expireOffersForResourceLocked(resource, now), now);
        }
    }

    private WaitlistResponseDTO toResponse(Waitlist entry) {
        Integer position = null;
        if (entry.getStatus() == Waitlist.Status.WAITING) {
            position = Math.toIntExact(waitlistRepository.queuePosition(
                    entry.getResource().getId(), entry.getRequestedStart(), entry.getRequestedEnd(),
                    entry.getRequestTime(), entry.getId()));
        }
        return WaitlistResponseDTO.from(entry, position);
    }

    private User requireUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Authenticated user was not found."));
    }

    private User requireStudent(String username) {
        User user = requireUser(username);
        if (user.getRole() != User.Role.STUDENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only students can manage waitlist requests and offers.");
        }
        return user;
    }

    private Waitlist requireOwned(Long entryId, User user) {
        Waitlist entry = waitlistRepository.findById(entryId).orElseThrow(() -> notFound(entryId));
        verifyOwner(entry, user);
        return entry;
    }

    private Waitlist requireOwnedForUpdate(Long entryId, User user) {
        Waitlist entry = waitlistRepository.findByIdForUpdate(entryId).orElseThrow(() -> notFound(entryId));
        verifyOwner(entry, user);
        return entry;
    }

    private void verifyOwner(Waitlist entry, User user) {
        if (!entry.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You cannot access another student's waitlist request.");
        }
    }

    private void requireActiveOffer(Waitlist entry, String action) {
        if (entry.getStatus() != Waitlist.Status.OFFERED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This offer is no longer active and cannot be " + action + "ed.");
        }
    }

    private void requireBookable(Resource resource) {
        if (resource.getStatus() == Resource.Status.MAINTENANCE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Resources in maintenance cannot be waitlisted or booked.");
        }
        if (resource.getStatus() != Resource.Status.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This resource is not currently bookable.");
        }
    }

    private void validateInterval(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null || !end.isAfter(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "endTime must be strictly after startTime.");
        }
        if (!start.isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "startTime must be in the future.");
        }
    }

    private ResponseStatusException notFound(Long entryId) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Waitlist request not found with id: " + entryId);
    }

    private record SlotWindow(LocalDateTime start, LocalDateTime end) { }

    private record AdminSlotKey(
            Long resourceId, String resourceName, LocalDateTime start, LocalDateTime end) { }
}
