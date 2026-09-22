package com.campusbooking.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/** Privacy-safe exact-interval availability search results. */
@Data
@Builder
public class AvailabilitySearchResponseDTO {

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private List<ResultDTO> results;

    @Data
    @Builder
    public static class ResultDTO {
        private String targetType;
        private Long id;
        private String name;
        private String type;
        private String description;
        private String location;
        private Integer capacity;
        private Integer includedResourceCount;
        private String readiness;
    }
}
