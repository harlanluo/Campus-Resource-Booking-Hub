package com.campusbooking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request payload for joining the waitlist for a campus resource.
 *
 * <p>Both {@code userId} and {@code resourceId} are required; Bean Validation
 * will reject null values before the request reaches the service layer.</p>
 */
@Data
public class WaitlistRequestDTO {

    /** ID of the user who wants to join the waitlist. */
    @NotNull(message = "userId is required")
    private Long userId;

    /** ID of the resource the user is waiting for. */
    @NotNull(message = "resourceId is required")
    private Long resourceId;
}
