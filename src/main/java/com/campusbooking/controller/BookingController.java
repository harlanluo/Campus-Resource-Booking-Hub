package com.campusbooking.controller;

import com.campusbooking.dto.BookingRequestDTO;
import com.campusbooking.dto.BookingResponseDTO;
import com.campusbooking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for campus resource booking operations.
 *
 * <pre>
 * POST /api/bookings               – Create a new booking
 * GET  /api/bookings/user/{userId} – Retrieve all bookings for a user
 * PUT  /api/bookings/{bookingId}/cancel – Cancel an existing booking
 * </pre>
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * Creates a new booking for a campus resource.
     *
     * <ul>
     *   <li>{@code 201 Created}  – booking saved successfully; returns {@link BookingResponseDTO}</li>
     *   <li>{@code 400 Bad Request} – invalid time window (past start, end ≤ start)</li>
     *   <li>{@code 404 Not Found}   – user or resource does not exist</li>
     *   <li>{@code 409 Conflict}    – resource unavailable or time-slot already booked</li>
     * </ul>
     *
     * <p>Example request body:
     * <pre>{@code
     * {
     *   "userId":     1,
     *   "resourceId": 2,
     *   "startTime":  "2025-09-01T10:00:00",
     *   "endTime":    "2025-09-01T12:00:00"
     * }
     * }</pre>
     * </p>
     *
     * @param request the booking payload (validated via Bean Validation)
     * @return {@code 201 Created} with the persisted booking details
     */
    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(
            @Valid @RequestBody BookingRequestDTO request) {

        BookingResponseDTO response = bookingService.createBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieves all bookings made by a specific user.
     *
     * <ul>
     *   <li>{@code 200 OK}       – returns list of the user's bookings (may be empty)</li>
     *   <li>{@code 404 Not Found} – user with the given ID does not exist</li>
     * </ul>
     *
     * @param userId the ID of the user whose bookings are requested
     * @return {@code 200 OK} with a list of {@link BookingResponseDTO}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookingResponseDTO>> getUserBookings(
            @PathVariable Long userId) {

        List<BookingResponseDTO> bookings = bookingService.getUserBookings(userId);
        return ResponseEntity.ok(bookings);
    }

    /**
     * Cancels an existing booking.
     *
     * <ul>
     *   <li>{@code 200 OK}        – booking cancelled; returns updated {@link BookingResponseDTO}</li>
     *   <li>{@code 400 Bad Request} – booking is already cancelled or completed</li>
     *   <li>{@code 404 Not Found}   – booking with the given ID does not exist</li>
     * </ul>
     *
     * @param bookingId the ID of the booking to cancel
     * @return {@code 200 OK} with the updated booking reflecting {@code CANCELLED} status
     */
    @PutMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable Long bookingId) {

        BookingResponseDTO response = bookingService.cancelBooking(bookingId);
        return ResponseEntity.ok(response);
    }
}
