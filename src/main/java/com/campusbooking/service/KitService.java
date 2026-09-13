package com.campusbooking.service;

import com.campusbooking.dto.BookingResponseDTO;
import com.campusbooking.dto.KitBookingRequestDTO;
import com.campusbooking.dto.KitResponseDTO;
import com.campusbooking.exception.BookingConflictException;
import com.campusbooking.model.Booking;
import com.campusbooking.model.Kit;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.KitRepository;
import com.campusbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Business logic layer for {@link Kit} (Resource Bundle) operations.
 *
 * <h3>Atomic Conflict Prevention</h3>
 * When a student books an entire pre-configured kit via {@link #bookKit(Long, KitBookingRequestDTO)},
 * the service performs an atomic validation and overlap check across ALL bundled resources.
 * If ANY single sub-item is unavailable (in MAINTENANCE or has an overlapping reservation),
 * the transaction is aborted immediately with a 409 Conflict, ensuring that either ALL items
 * are reserved simultaneously or NONE are reserved.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KitService {

    private final KitRepository     kitRepository;
    private final UserRepository    userRepository;
    private final BookingRepository bookingRepository;

    // ── Queries ───────────────────────────────────────────────────────────────

    /**
     * Retrieves all available project kits with their bundled items.
     *
     * @return list of {@link KitResponseDTO}
     */
    public List<KitResponseDTO> getAllKits() {
        return kitRepository.findAllWithResources()
                .stream()
                .map(KitResponseDTO::from)
                .toList();
    }

    /**
     * Retrieves a single kit by its ID.
     *
     * @param kitId the ID of the kit
     * @return the {@link KitResponseDTO}
     * @throws ResponseStatusException {@code 404} if the kit is not found
     */
    public KitResponseDTO getKitById(Long kitId) {
        Kit kit = kitRepository.findByIdWithResources(kitId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Kit not found with id: " + kitId));
        return KitResponseDTO.from(kit);
    }

    // ── Atomic Kit Booking ────────────────────────────────────────────────────

    /**
     * Atomically reserves all resources bundled within a project kit.
     *
     * <h4>Atomic Conflict Prevention Sequence</h4>
     * <ol>
     *   <li>Kit and User existence checks (404 if missing).</li>
     *   <li>Time window validation: start must be in the future, end must be after start (400).</li>
     *   <li>Group member resolution (if provided).</li>
     *   <li>Availability check: ALL bundled resources must have status {@code AVAILABLE} (409).</li>
     *   <li>Overlap check: ALL bundled resources must have NO overlapping CONFIRMED/PENDING/APPROVED bookings (409).</li>
     *   <li>If and only if all pass, reservations for all bundled items are persisted atomically.</li>
     * </ol>
     *
     * @param kitId   the ID of the kit to reserve
     * @param request the kit booking payload
     * @return list of created {@link BookingResponseDTO} representing each bundled item
     * @throws ResponseStatusException  {@code 404} if kit/user missing; {@code 400} if times invalid; {@code 409} if item unavailable
     * @throws BookingConflictException if any bundled resource has a scheduling conflict
     */
    @Transactional
    public List<BookingResponseDTO> bookKit(Long kitId, KitBookingRequestDTO request) {

        // 1. Resolve User
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found with id: " + request.getUserId()));

        // 2. Resolve Kit
        Kit kit = kitRepository.findByIdWithResources(kitId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Kit not found with id: " + kitId));

        if (kit.getResources() == null || kit.getResources().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Kit '" + kit.getName() + "' contains no bundled resources.");
        }

        // 3. Validate Time Window
        LocalDateTime now = LocalDateTime.now();
        if (!request.getStartTime().isAfter(now)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "startTime must be in the future.");
        }

        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "endTime must be strictly after startTime.");
        }

        // 4. Resolve Group Members (if any)
        Set<User> groupMembers = new HashSet<>();
        if (request.getMemberUserIds() != null) {
            for (Long memberId : request.getMemberUserIds()) {
                if (memberId != null && !memberId.equals(user.getId())) {
                    User member = userRepository.findById(memberId)
                            .orElseThrow(() -> new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Group member not found with id: " + memberId));
                    groupMembers.add(member);
                }
            }
        }
        if (request.getMemberUsernames() != null) {
            for (String uname : request.getMemberUsernames()) {
                if (uname != null && !uname.isBlank() && !uname.equalsIgnoreCase(user.getUsername())) {
                    User member = userRepository.findByUsername(uname.trim())
                            .orElseThrow(() -> new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Group member not found with username: " + uname));
                    groupMembers.add(member);
                }
            }
        }

        // 5. ATOMIC VALIDATION: Check Status & Overlap for EVERY bundled resource
        List<Resource> orderedResources = kit.getResources().stream()
                .sorted(Comparator.comparing(Resource::getId))
                .toList();

        for (Resource resource : orderedResources) {
            // (a) Resource status check
            if (resource.getStatus() != Resource.Status.AVAILABLE) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Resource '" + resource.getName() + "' in kit is not available (current status: "
                                + resource.getStatus() + ").");
            }

            // (b) Overlap / scheduling conflict check
            List<Booking> conflicts = bookingRepository.findOverlappingBookings(
                    resource.getId(),
                    request.getStartTime(),
                    request.getEndTime());

            if (!conflicts.isEmpty()) {
                throw new BookingConflictException(
                        "Resource '" + resource.getName() + "' in kit is already booked during this time slot.");
            }
        }

        // 6. ATOMIC PERSISTENCE: Create Booking for every item in the kit
        List<Booking> bookingsToSave = new ArrayList<>();
        for (Resource resource : orderedResources) {
            Booking booking = Booking.builder()
                    .user(user)
                    .resource(resource)
                    .startTime(request.getStartTime())
                    .endTime(request.getEndTime())
                    .status(Booking.Status.PENDING)
                    .groupMembers(new HashSet<>(groupMembers))
                    .build();
            bookingsToSave.add(booking);
        }

        List<Booking> saved = bookingRepository.saveAll(bookingsToSave);
        log.info("[Kit Booking] User {} booked entire kit '{}' (ID: {}) containing {} items.",
                user.getUsername(), kit.getName(), kit.getId(), saved.size());

        return saved.stream()
                .map(BookingResponseDTO::from)
                .toList();
    }
}
