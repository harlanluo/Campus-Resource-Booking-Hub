package com.campusbooking.dto;

import com.campusbooking.model.Kit;
import com.campusbooking.model.Resource;
import lombok.Builder;
import lombok.Data;

import java.util.Collections;
import java.util.List;

/**
 * Response DTO returned when querying project kits.
 */
@Data
@Builder
public class KitResponseDTO {

    /** Kit identifier. */
    private Long id;

    /** Kit name. */
    private String name;

    /** Kit description. */
    private String description;

    /** Total number of bundled items. */
    private int itemCount;

    /** List of bundled resource items. */
    private List<KitItemDTO> items;

    @Data
    @Builder
    public static class KitItemDTO {
        private Long id;
        private String name;
        private String type;
        private String description;
        private Resource.Status status;
    }

    /**
     * Converts a {@link Kit} entity into a {@link KitResponseDTO}.
     *
     * @param kit the Kit entity
     * @return the mapped KitResponseDTO
     */
    public static KitResponseDTO from(Kit kit) {
        List<KitItemDTO> items = kit.getResources() != null
                ? kit.getResources().stream()
                        .map(r -> KitItemDTO.builder()
                                .id(r.getId())
                                .name(r.getName())
                                .type(r.getType())
                                .description(r.getDescription())
                                .status(r.getStatus())
                                .build())
                        .sorted((a, b) -> a.getId().compareTo(b.getId()))
                        .toList()
                : Collections.emptyList();

        return KitResponseDTO.builder()
                .id(kit.getId())
                .name(kit.getName())
                .description(kit.getDescription())
                .itemCount(items.size())
                .items(items)
                .build();
    }
}
