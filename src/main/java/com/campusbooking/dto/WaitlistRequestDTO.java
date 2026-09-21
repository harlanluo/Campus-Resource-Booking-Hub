package com.campusbooking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Request payload for joining the waitlist for a campus resource.
 *
 * <p>Both {@code userId} and {@code resourceId} are required; Bean Validation
 * will reject null values before the request reaches the service layer.</p>
 */
@Data
public class WaitlistRequestDTO {

    /** ID of the resource the user is waiting for. */
    @NotNull(message = "resourceId is required")
    private Long resourceId;

    @NotNull(message = "startTime is required")
    private LocalDateTime startTime;

    @NotNull(message = "endTime is required")
    private LocalDateTime endTime;
}
