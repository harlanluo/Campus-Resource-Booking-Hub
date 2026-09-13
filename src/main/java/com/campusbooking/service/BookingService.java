package com.campusbooking.service;

import com.campusbooking.dto.BookingRequestDTO;
import com.campusbooking.dto.BookingResponseDTO;
import com.campusbooking.exception.BookingConflictException;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Business logic layer for {@link Booking} operations.
 *
 * <h3>Conflict-prevention strategy</h3>
 * Before persisting any new booking the service locks the resource row, then
 * executes a JPQL overlap query
 * (see {@link com.campusbooking.repository.BookingRepository#findOverlappingBookings})
 * that returns any CONFIRMED, PENDING, or APPROVED booking where:
 * <pre>
 *   existingStart &lt; newEndTime  AND  existingEnd &gt; newStartTime
 * </pre>
 * If the query returns a non-empty list a {@link BookingConflictException} is
 * thrown immediately. The row lock keeps this check-and-insert sequence safe
 * when requests for the same resource arrive concurrently.
 *
 * <h3>Waitlist auto-trigger</h3>
 * When {@link #cancelBooking(Long)} cancels a booking, the service
 * automatically checks the waitlist for that resource. If any {@code WAITING}
 * entries exist, the earliest student receives a new PENDING booking for the
 * exact released time slot and the queue entry becomes {@code PROMOTED}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingService {

    private final BookingRepository   bookingRepository;
    private final ResourceRepository  resourceRepository;
    private final UserRepository      userRepository;
    private final WaitlistRepository  waitlistRepository;

    // ── Create ────────────────────────────────────────────────────────────────

    /**
     * Creates a new booking after running all validation and conflict checks.
     *
     * <h4>Validation sequence</h4>
     * <ol>
     *   <li>User must exist.</li>
     *   <li>Resource must exist and its status must be {@link Resource.Status#AVAILABLE}.</li>
     *   <li>{@code startTime} must be strictly in the future.</li>
     *   <li>{@code endTime} must be strictly after {@code startTime}.</li>
     *   <li>No CONFIRMED/PENDING/APPROVED booking may overlap the requested window.</li>
     * </ol>
     *
     * @param request the booking payload from the HTTP layer
     * @return a {@link BookingResponseDTO} representing the newly saved booking
     * @throws ResponseStatusException   {@code 404} if the user or resource is not found;
     *                                   {@code 400} if time constraints are violated;
     *                                   {@code 409} if the resource is unavailable (status)
     * @throws BookingConflictException  if an overlapping booking already exists
     */
    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO request) {

        // 1. Resolve user
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found with id: " + request.getUserId()));

        // 2. Resolve resource
        Resource resource = resourceRepository.findByIdForUpdate(request.getResourceId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Resource not found with id: " + request.getResourceId()));

        // 3. Resource must be AVAILABLE
        if (resource.getStatus() != Resource.Status.AVAILABLE) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Resource '" + resource.getName() + "' is not available for booking "
                            + "(current status: " + resource.getStatus() + ").");
        }

        // 4. startTime must be in the future
        LocalDateTime now = LocalDateTime.now();
        if (!request.getStartTime().isAfter(now)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "startTime must be in the future.");
        }

        // 5. endTime must be after startTime
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "endTime must be strictly after startTime.");
        }

        // 6. Overlap / conflict check ─────────────────────────────────────────
        List<Booking> conflicts = bookingRepository.findOverlappingBookings(
                resource.getId(),
                request.getStartTime(),
                request.getEndTime());

        if (!conflicts.isEmpty()) {
            throw new BookingConflictException(
                    "Resource is already booked during this time slot");
        }

        // 7. Resolve group members (if any) ──────────────────────────────────
        java.util.Set<User> groupMembers = new java.util.HashSet<>();
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

        // 8. Persist the new booking
        Booking booking = Booking.builder()
                .user(user)
                .resource(resource)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(Booking.Status.PENDING)
                .groupMembers(groupMembers)
                .build();

        Booking saved = bookingRepository.save(booking);
        return BookingResponseDTO.from(saved);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    /**
     * Returns all bookings where the user is either the primary creator
     * or an invited collaborative group member.
     *
     * @param userId the ID of the user
     * @return list of the user's bookings as DTOs (may be empty)
     * @throws ResponseStatusException {@code 404} if the user does not exist
     */
    public List<BookingResponseDTO> getUserBookings(Long userId) {
        // Verify the user exists before hitting the bookings table
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "User not found with id: " + userId);
        }

        return bookingRepository.findAllUserBookings(userId)
                .stream()
                .map(BookingResponseDTO::from)
                .toList();
    }


    /**
     * Returns all bookings in the system regardless of user (for Admin overview).
     *
     * @return list of all bookings as DTOs
     */
    public List<BookingResponseDTO> getAllBookings() {
        return bookingRepository.findAll()
                .stream()
                .map(BookingResponseDTO::from)
                .toList();
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    /**
     * Cancels an existing booking by setting its status to
     * {@link Booking.Status#CANCELLED}.
     *
     * <p>Only bookings in the {@code PENDING} or {@code CONFIRMED} state may be
     * cancelled; attempting to cancel a {@code COMPLETED} or already-{@code CANCELLED}
     * booking returns a {@code 400 BAD REQUEST}.</p>
     *
     * <h4>Waitlist auto-trigger</h4>
     * After cancellation, the service queries the waitlist for the freed resource.
     * If one or more {@code WAITING} entries exist, the earliest entry receives
     * a PENDING booking for this exact slot and is marked {@code PROMOTED}.
     *
     * @param bookingId the ID of the booking to cancel
     * @return the updated {@link BookingResponseDTO} reflecting the new status
     * @throws ResponseStatusException {@code 404} if the booking does not exist;
     *                                 {@code 400} if the booking cannot be cancelled
     */
    @Transactional
    public BookingResponseDTO cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Booking not found with id: " + bookingId));

        if (booking.getStatus() == Booking.Status.CANCELLED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Booking " + bookingId + " is already cancelled.");
        }
        if (booking.getStatus() == Booking.Status.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Completed bookings cannot be cancelled.");
        }

        boolean releasedBlockingSlot = booking.getStatus() == Booking.Status.PENDING
                || booking.getStatus() == Booking.Status.CONFIRMED
                || booking.getStatus() == Booking.Status.APPROVED;

        booking.setStatus(Booking.Status.CANCELLED);
        Booking updated = bookingRepository.save(booking);

        // ── Waitlist auto-trigger ─────────────────────────────────────────────
        if (releasedBlockingSlot) {
            triggerWaitlistPromotion(booking);
        }

        return BookingResponseDTO.from(updated);
    }

    // ── Admin: Approve / Reject ───────────────────────────────────────────────

    /**
     * Approves a booking by setting its status to {@link Booking.Status#APPROVED}.
     *
     * <p>Can be applied to bookings in any state except {@code CANCELLED} or
     * {@code COMPLETED}.</p>
     *
     * @param bookingId the ID of the booking to approve
     * @return the updated {@link BookingResponseDTO} reflecting {@code APPROVED} status
     * @throws ResponseStatusException {@code 404} if the booking does not exist;
     *                                 {@code 400} if the booking is already terminal
     */
    @Transactional
    public BookingResponseDTO approveBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Booking not found with id: " + bookingId));

        if (booking.getStatus() == Booking.Status.CANCELLED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot approve a cancelled booking.");
        }
        if (booking.getStatus() == Booking.Status.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot approve a completed booking.");
        }

        booking.setStatus(Booking.Status.APPROVED);
        Booking updated = bookingRepository.save(booking);
        log.info("[Admin] Booking {} approved.", bookingId);
        return BookingResponseDTO.from(updated);
    }

    /**
     * Rejects a booking by setting its status to {@link Booking.Status#REJECTED}.
     *
     * <p>Can be applied to bookings in {@code PENDING} state.  Rejecting an
     * already-terminal booking returns a {@code 400}.</p>
     *
     * @param bookingId the ID of the booking to reject
     * @return the updated {@link BookingResponseDTO} reflecting {@code REJECTED} status
     * @throws ResponseStatusException {@code 404} if the booking does not exist;
     *                                 {@code 400} if the booking is already terminal
     */
    @Transactional
    public BookingResponseDTO rejectBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Booking not found with id: " + bookingId));

        if (booking.getStatus() == Booking.Status.CANCELLED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot reject a cancelled booking.");
        }
        if (booking.getStatus() == Booking.Status.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot reject a completed booking.");
        }

        booking.setStatus(Booking.Status.REJECTED);
        Booking updated = bookingRepository.save(booking);
        log.info("[Admin] Booking {} rejected.", bookingId);
        return BookingResponseDTO.from(updated);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Assigns the exact released slot to the earliest waiting student, then
     * marks that queue entry as promoted.
     *
     * <p>Called automatically after a booking is cancelled, freeing up a slot
     * that a waitlisted user may now claim.</p>
     *
     * @param releasedBooking the cancelled booking whose slot became available
     */
    private void triggerWaitlistPromotion(Booking releasedBooking) {
        Long resourceId = releasedBooking.getResource().getId();
        List<Waitlist> queue = waitlistRepository
                .findByResourceIdAndStatusOrderByRequestTimeAsc(resourceId, Waitlist.Status.WAITING);

        if (!queue.isEmpty()) {
            Waitlist next = queue.get(0);

            Booking promotedBooking = Booking.builder()
                    .user(next.getUser())
                    .resource(releasedBooking.getResource())
                    .startTime(releasedBooking.getStartTime())
                    .endTime(releasedBooking.getEndTime())
                    .status(Booking.Status.PENDING)
                    .build();
            Booking savedPromotion = bookingRepository.save(promotedBooking);

            next.setStatus(Waitlist.Status.PROMOTED);
            waitlistRepository.save(next);
            log.info("[Waitlist Auto-Trigger] User {} received booking {} for released slot on resource {}.",
                    next.getUser().getId(), savedPromotion.getId(), resourceId);
        }
    }
}
