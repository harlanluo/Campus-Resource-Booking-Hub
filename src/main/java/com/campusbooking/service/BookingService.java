package com.campusbooking.service;

import com.campusbooking.dto.BookingRequestDTO;
import com.campusbooking.dto.BookingResponseDTO;
import com.campusbooking.exception.BookingConflictException;
import com.campusbooking.model.Booking;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
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
 * <h3>Waitlist release integration</h3>
 * Cancellation and rejection offer the exact released slot to the first
 * eligible waiting student. A booking is created only after acceptance.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingService {

    private final BookingRepository   bookingRepository;
    private final ResourceRepository  resourceRepository;
    private final UserRepository      userRepository;
    private final WaitlistService     waitlistService;

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

        waitlistService.processExpiredOffersForResource(resource.getId(), now);

        // 6. Overlap / conflict check ─────────────────────────────────────────
        List<Booking> conflicts = bookingRepository.findOverlappingBookings(
                resource.getId(),
                request.getStartTime(),
                request.getEndTime());

        if (!conflicts.isEmpty()) {
            throw new BookingConflictException(
                    "Resource is already booked during this time slot");
        }
        if (waitlistService.hasActiveOfferConflict(
                resource.getId(), request.getStartTime(), request.getEndTime(), now)) {
            throw new BookingConflictException(
                    "Resource is temporarily held for an active slot offer");
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

        LocalDateTime now = LocalDateTime.now();
        return bookingRepository.findActiveUserBookings(userId, now)
                .stream()
                .map(booking -> BookingResponseDTO.from(booking, now))
                .toList();
    }

    /** Returns closed and expired bookings owned by or shared with a user. */
    public List<BookingResponseDTO> getUserBookingHistory(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "User not found with id: " + userId);
        }

        LocalDateTime now = LocalDateTime.now();
        return bookingRepository.findHistoryUserBookings(userId, now)
                .stream()
                .map(booking -> BookingResponseDTO.from(booking, now))
                .toList();
    }


    /**
     * Returns current/future pending and approved bookings for the Admin queue.
     *
     * @return list of all bookings as DTOs
     */
    public List<BookingResponseDTO> getAllBookings() {
        LocalDateTime now = LocalDateTime.now();
        return bookingRepository.findActiveAdminBookings(now)
                .stream()
                .map(booking -> BookingResponseDTO.from(booking, now))
                .toList();
    }

    /** Returns closed and expired bookings for administrators. */
    public List<BookingResponseDTO> getBookingHistory() {
        LocalDateTime now = LocalDateTime.now();
        return bookingRepository.findHistoryAdminBookings(now)
                .stream()
                .map(booking -> BookingResponseDTO.from(booking, now))
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
     * After cancellation, waiting requests affected by the released interval
     * are rechecked against current bookings and temporary offers. Eligible
     * requests receive an offer without creating a booking.
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
        rejectKitChildAction(booking);

        LocalDateTime now = LocalDateTime.now();
        if (isEffectivelyCompleted(booking, now)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Completed bookings cannot be cancelled.");
        }
        if (!isCancellableStatus(booking.getStatus())) {
            throw invalidTransition(booking, Booking.Status.CANCELLED);
        }
        if (!booking.getStartTime().isAfter(now)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Bookings cannot be cancelled after the reservation has started.");
        }

        booking.setStatus(Booking.Status.CANCELLED);
        Booking updated = bookingRepository.save(booking);
        bookingRepository.flush();

        // ── Waitlist auto-trigger ─────────────────────────────────────────────
        waitlistService.offerReleasedSlot(
                booking.getResource(), booking.getStartTime(), booking.getEndTime());

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
        rejectKitChildAction(booking);

        LocalDateTime now = LocalDateTime.now();
        if (isEffectivelyCompleted(booking, now)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Completed bookings cannot be approved.");
        }
        if (!booking.getEndTime().isAfter(now)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Expired booking requests cannot be approved.");
        }
        if (booking.getStatus() != Booking.Status.PENDING) {
            throw invalidTransition(booking, Booking.Status.APPROVED);
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
        rejectKitChildAction(booking);

        LocalDateTime now = LocalDateTime.now();
        if (isEffectivelyCompleted(booking, now)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Completed bookings cannot be rejected.");
        }
        if (!booking.getEndTime().isAfter(now)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Expired booking requests cannot be rejected.");
        }
        if (booking.getStatus() != Booking.Status.PENDING) {
            throw invalidTransition(booking, Booking.Status.REJECTED);
        }

        booking.setStatus(Booking.Status.REJECTED);
        Booking updated = bookingRepository.save(booking);
        bookingRepository.flush();
        waitlistService.offerReleasedSlot(
                booking.getResource(), booking.getStartTime(), booking.getEndTime());
        log.info("[Admin] Booking {} rejected.", bookingId);
        return BookingResponseDTO.from(updated);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private boolean isEffectivelyCompleted(Booking booking, LocalDateTime now) {
        if (booking.getStatus() == Booking.Status.COMPLETED) {
            return true;
        }
        boolean successful = booking.getStatus() == Booking.Status.APPROVED
                || booking.getStatus() == Booking.Status.CONFIRMED;
        return successful && !booking.getEndTime().isAfter(now);
    }

    private void rejectKitChildAction(Booking booking) {
        if (booking.getKitBooking() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This booking belongs to Kit reservation "
                            + booking.getKitBooking().getBookingReference()
                            + "; use the parent Kit booking endpoint.");
        }
    }

    private boolean isCancellableStatus(Booking.Status status) {
        return status == Booking.Status.PENDING
                || status == Booking.Status.APPROVED
                || status == Booking.Status.CONFIRMED;
    }

    private ResponseStatusException invalidTransition(Booking booking, Booking.Status target) {
        return new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Cannot change booking " + booking.getId() + " from "
                        + booking.getStatus() + " to " + target + ".");
    }

}
