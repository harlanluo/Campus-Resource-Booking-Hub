package com.campusbooking.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Centralized exception handler for the Campus Booking Hub API.
 *
 * <p>Intercepts exceptions thrown by any {@code @RestController} and converts
 * them into consistent JSON error responses, preventing raw exception details
 * from leaking to the client.</p>
 *
 * <h3>Handled exceptions</h3>
 * <ul>
 *   <li>{@link BookingConflictException}        → 409 Conflict</li>
 *   <li>{@link ResponseStatusException}         → mirrors its embedded HTTP status</li>
 *   <li>{@link MethodArgumentNotValidException} → 400 Bad Request (Bean Validation)</li>
 *   <li>{@link Exception}                       → 500 Internal Server Error (catch-all)</li>
 * </ul>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── BookingConflictException ──────────────────────────────────────────────

    /**
     * Handles time-slot scheduling conflicts detected by {@code BookingService}.
     *
     * @param ex the thrown {@link BookingConflictException}
     * @return {@code 409 Conflict} with a structured JSON body
     */
    @ExceptionHandler(BookingConflictException.class)
    public ResponseEntity<Map<String, Object>> handleBookingConflict(
            BookingConflictException ex) {

        String message = (ex.getMessage() != null && !ex.getMessage().isBlank())
                ? ex.getMessage()
                : "Resource is already booked for the selected time slot.";
        return errorBody(HttpStatus.CONFLICT, message);
    }

    // ── ResponseStatusException ───────────────────────────────────────────────

    /**
     * Handles {@link ResponseStatusException} thrown by service methods for
     * 400/404/409 scenarios (missing entities, invalid input, etc.).
     *
     * @param ex the thrown exception carrying an embedded HTTP status
     * @return a structured JSON error response matching the exception's status
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(
            ResponseStatusException ex) {

        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;
        return errorBody(status, ex.getReason());
    }

    // ── Bean Validation (400) ─────────────────────────────────────────────────

    /**
     * Handles Bean Validation failures triggered by {@code @Valid} in controllers.
     *
     * <p>Collects all field-level constraint violations into a single comma-separated
     * message so the client can see every problem at once.</p>
     *
     * @param ex the thrown validation exception
     * @return {@code 400 Bad Request} listing all violated constraints
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex) {

        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));

        return errorBody(HttpStatus.BAD_REQUEST, details);
    }

    /** Converts method-security authorization failures into a clear 403 response. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return errorBody(HttpStatus.FORBIDDEN,
                "You do not have permission to perform this operation.");
    }

    // ── Catch-all (500) ───────────────────────────────────────────────────────

    /**
     * Catch-all handler for any unexpected runtime exception.
     *
     * @param ex the unhandled exception
     * @return {@code 500 Internal Server Error}
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        return errorBody(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.");
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    /**
     * Builds a consistent JSON error envelope.
     *
     * <pre>{@code
     * {
     *   "timestamp": "2025-09-01T10:00:00",
     *   "status":    409,
     *   "error":     "Resource is already booked for the selected time slot.",
     *   "message":   "Resource is already booked for the selected time slot."
     * }
     * }</pre>
     *
     * @param status  the HTTP status to return
     * @param message the human-readable error description
     * @return a {@link ResponseEntity} wrapping the error map
     */
    private ResponseEntity<Map<String, Object>> errorBody(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status",    status.value());
        body.put("error",     message);
        body.put("message",   message);
        return ResponseEntity.status(status).body(body);
    }
}
