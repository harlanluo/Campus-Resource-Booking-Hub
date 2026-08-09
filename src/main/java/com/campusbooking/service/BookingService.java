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
 * Before persisting any new booking the service executes a JPQL overlap query
 * (see {@link com.campusbooking.repository.BookingRepository#findOverlappingBookings})
 * that returns any CONFIRMED or PENDING booking where:
 * <pre>
 *   existingStart &lt; newEndTime  AND  existingEnd &gt; newStartTime
 * </pre>
 * If the query returns a non-empty list a {@link BookingConflictException} is
 * thrown immediately, preventing dual-booking of the same time slot.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingService {

    private final BookingRepository   bookingRepository;
    private final ResourceRepository  resourceRepository;
    private final UserRepository      userRepository;

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
     *   <li>No CONFIRMED/PENDING booking may overlap the requested window.</li>
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
        Resource resource = resourceRepository.findById(request.getResourceId())
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

        // 7. Persist the new booking
        Booking booking = Booking.builder()
                .user(user)
                .resource(resource)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(Booking.Status.PENDING)
                .build();

        Booking saved = bookingRepository.save(booking);
        return BookingResponseDTO.from(saved);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    /**
     * Returns all bookings made by a specific user.
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

        return bookingRepository.findByUserId(userId)
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

        booking.setStatus(Booking.Status.CANCELLED);
        Booking updated = bookingRepository.save(booking);
        return BookingResponseDTO.from(updated);
    }
}
