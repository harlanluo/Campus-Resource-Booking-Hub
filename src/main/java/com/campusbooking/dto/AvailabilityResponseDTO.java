package com.campusbooking.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/** Privacy-safe schedule information for a resource or Project Kit. */
@Data
@Builder
public class AvailabilityResponseDTO {

    private String targetType;
    private Long targetId;
    private String name;
    private String type;
    private String description;
    private String operationalStatus;
    private Integer resourceCount;
    private LocalDateTime windowStart;
    private LocalDateTime windowEnd;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private int intervalMinutes;
    private List<SlotDTO> slots;

    @Data
    @Builder
    public static class SlotDTO {
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private SlotStatus status;
        private String label;
    }

    public enum SlotStatus {
        AVAILABLE,
        BOOKED,
        PENDING,
        HELD,
        MAINTENANCE,
        UNAVAILABLE,
        PAST
    }
}
