package com.campusbooking.dto;

import com.campusbooking.model.Booking;
import com.campusbooking.model.KitBooking;
import com.campusbooking.model.User;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/** Public product-level representation of a Project Kit reservation. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KitBookingResponseDTO {
    private Long id;
    private String bookingReference;
    private Long kitId;
    private String kitName;
    private String kitDescription;
    private Long ownerId;
    private String ownerName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private KitBooking.Status status;
    private List<ResourceSummary> includedResources;
    private int resourceCount;
    private List<Long> groupMemberIds;
    private List<String> groupMemberNames;
    private boolean groupBooking;

    public static KitBookingResponseDTO from(
            KitBooking kitBooking, List<Booking> children, LocalDateTime now) {
        List<Booking> orderedChildren = children.stream()
                .sorted(Comparator.comparing(child -> child.getResource().getId()))
                .toList();
        List<User> members = kitBooking.getGroupMembers() == null
                ? List.of()
                : kitBooking.getGroupMembers().stream()
                        .sorted(Comparator.comparing(User::getUsername, String.CASE_INSENSITIVE_ORDER))
                        .toList();
        KitBooking.Status effectiveStatus = kitBooking.getStatus() == KitBooking.Status.APPROVED
                && !kitBooking.getEndTime().isAfter(now)
                ? KitBooking.Status.COMPLETED
                : kitBooking.getStatus();

        return KitBookingResponseDTO.builder()
                .id(kitBooking.getId())
                .bookingReference(kitBooking.getBookingReference())
                .kitId(kitBooking.getKit().getId())
                .kitName(kitBooking.getKit().getName())
                .kitDescription(kitBooking.getKit().getDescription())
                .ownerId(kitBooking.getUser().getId())
                .ownerName(kitBooking.getUser().getUsername())
                .startTime(kitBooking.getStartTime())
                .endTime(kitBooking.getEndTime())
                .status(effectiveStatus)
                .includedResources(orderedChildren.stream()
                        .map(child -> new ResourceSummary(
                                child.getResource().getId(),
                                child.getResource().getName(),
                                child.getResource().getType(),
                                child.getResource().getLocation(),
                                child.getResource().getCapacity()))
                        .toList())
                .resourceCount(orderedChildren.size())
                .groupMemberIds(members.stream().map(User::getId).toList())
                .groupMemberNames(members.stream().map(User::getUsername).toList())
                .groupBooking(!members.isEmpty())
                .build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceSummary {
        private Long id;
        private String name;
        private String type;
        private String location;
        private Integer capacity;
    }
}
