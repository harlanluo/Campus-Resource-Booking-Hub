package com.campusbooking.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Request payload for booking an entire pre-configured project kit
 * via {@code POST /api/kits/{kitId}/book}.
 */
@Data
public class KitBookingRequestDTO {

    /** ID of the user requesting the kit reservation. */
    @NotNull(message = "userId must not be null")
    private Long userId;

    /** Desired start time for the reservation. */
    @NotNull(message = "startTime must not be null")
    @Future(message = "startTime must be in the future")
    private LocalDateTime startTime;

    /** Desired end time for the reservation. */
    @NotNull(message = "endTime must not be null")
    private LocalDateTime endTime;

    /** Optional list of user IDs for invited collaborative group members. */
    private List<Long> memberUserIds;

    /** Optional list of usernames for invited collaborative group members. */
    private List<String> memberUsernames;
}
