package com.campusbooking.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/** Privacy-safe operational summary of one active exact-slot waitlist queue. */
@Data
@Builder
public class WaitlistAdminOverviewDTO {
    private Long resourceId;
    private String resourceName;
    private LocalDateTime requestedStart;
    private LocalDateTime requestedEnd;
    private String status;
    private long waitingCount;
    private boolean activeOffer;
    private LocalDateTime offerExpiresAt;
}
