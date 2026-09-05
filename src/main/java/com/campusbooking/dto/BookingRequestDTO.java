package com.campusbooking.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Request body for {@code POST /api/bookings}.
 *
 * <p>Carries the minimal information required to create a new booking.
 * Bean Validation annotations are applied so that the controller layer can
 * delegate basic null/future-time checks to the framework before the payload
 * even reaches {@code BookingService}.</p>
 */
@Data
public class BookingRequestDTO {

    /** ID of the user making the booking. */
    @NotNull(message = "userId must not be null")
    private Long userId;

    /** ID of the resource to be booked. */
    @NotNull(message = "resourceId must not be null")
    private Long resourceId;

    /**
     * Desired start time of the booking.
     * Must be a future instant at the point of validation.
     */
    @NotNull(message = "startTime must not be null")
    @Future(message = "startTime must be in the future")
    private LocalDateTime startTime;

    /**
     * Desired end time of the booking.
     * Must be strictly after {@code startTime}; enforced inside
     * {@code BookingService.createBooking}.
     */
    @NotNull(message = "endTime must not be null")
    private LocalDateTime endTime;

    /**
     * Optional list of user IDs for invited group members (collaborative booking).
     */
    private java.util.List<Long> memberUserIds;

    /**
     * Optional list of usernames for invited group members.
     */
    private java.util.List<String> memberUsernames;
}

