package com.campusbooking.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a new booking request overlaps with an existing CONFIRMED or PENDING
 * booking for the same resource.
 *
 * <p>Annotated with {@code @ResponseStatus(409 CONFLICT)} so that Spring MVC
 * automatically maps unhandled instances to an HTTP 409 response body.</p>
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class BookingConflictException extends RuntimeException {

    /**
     * Creates a new {@code BookingConflictException} with the supplied detail message.
     *
     * @param message human-readable description of the scheduling conflict
     */
    public BookingConflictException(String message) {
        super(message);
    }
}
