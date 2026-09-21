package com.campusbooking.dto;

import com.campusbooking.model.Waitlist;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/** Privacy-safe view of one authenticated student's waitlist request. */
@Data
@Builder
public class WaitlistResponseDTO {
    private Long id;
    private Long resourceId;
    private String resourceName;
    private LocalDateTime requestTime;
    private LocalDateTime requestedStart;
    private LocalDateTime requestedEnd;
    private Waitlist.Status status;
    private String displayStatus;
    private Integer queuePosition;
    private LocalDateTime offerExpiresAt;

    public static WaitlistResponseDTO from(Waitlist waitlist, Integer queuePosition) {
        return WaitlistResponseDTO.builder()
                .id(waitlist.getId())
                .resourceId(waitlist.getResource().getId())
                .resourceName(waitlist.getResource().getName())
                .requestTime(waitlist.getRequestTime())
                .requestedStart(waitlist.getRequestedStart())
                .requestedEnd(waitlist.getRequestedEnd())
                .status(waitlist.getStatus())
                .displayStatus(displayStatus(waitlist.getStatus()))
                .queuePosition(queuePosition)
                .offerExpiresAt(waitlist.getOfferExpiresAt())
                .build();
    }

    private static String displayStatus(Waitlist.Status status) {
        return switch (status) {
            case WAITING -> "Waiting for this time";
            case OFFERED -> "Slot available for you";
            case ACCEPTED -> "Slot accepted";
            case DECLINED -> "Offer declined";
            case EXPIRED -> "Offer expired";
            case LEFT -> "Left waitlist";
        };
    }
}
