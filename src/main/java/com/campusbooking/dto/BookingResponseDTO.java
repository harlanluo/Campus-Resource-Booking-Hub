package com.campusbooking.dto;

import com.campusbooking.model.Booking;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Response body returned after creating or querying a {@link Booking}.
 *
 * <p>Exposes only the data the client needs; in particular, no sensitive
 * user data (e.g. passwords) leaks through this projection.</p>
 */
@Data
@Builder
public class BookingResponseDTO {

    /** Database-generated booking identifier. */
    private Long bookingId;

    // ── User summary ──────────────────────────────────────────────────────────

    /** ID of the user who made the booking. */
    private Long userId;

    /** Username of the booking owner. */
    private String username;

    // ── Resource summary ──────────────────────────────────────────────────────

    /** ID of the booked resource. */
    private Long resourceId;

    /** Human-readable name of the booked resource. */
    private String resourceName;

    /** Type label of the resource (e.g. ROOM, LAB, EQUIPMENT). */
    private String resourceType;

    /** Student-safe location label for the booked resource. */
    private String resourceLocation;

    // ── Booking window ────────────────────────────────────────────────────────

    /** The start of the reserved time slot. */
    private LocalDateTime startTime;

    /** The end of the reserved time slot. */
    private LocalDateTime endTime;

    // ── Status ────────────────────────────────────────────────────────────────

    /** Current lifecycle status of the booking. */
    private Booking.Status status;

    // ── Group Booking Summary ────────────────────────────────────────────────
    /** IDs of invited co-members for group bookings. */
    private java.util.List<Long> groupMemberIds;

    /** Usernames of invited co-members for group bookings. */
    private java.util.List<String> groupMemberNames;

    /** Indicates whether this booking is a collaborative group booking with peers. */
    private boolean groupBooking;


    // ── Factory ───────────────────────────────────────────────────────────────

    /**
     * Convenience factory that maps a {@link Booking} entity to this DTO.
     *
     * @param booking the persisted booking entity
     * @return a fully-populated {@code BookingResponseDTO}
     */
    public static BookingResponseDTO from(Booking booking) {
        return from(booking, LocalDateTime.now());
    }

    /** Maps a booking using one clock value for lifecycle classification. */
    public static BookingResponseDTO from(Booking booking, LocalDateTime now) {
        java.util.List<Long> memberIds = java.util.Collections.emptyList();
        java.util.List<String> memberNames = java.util.Collections.emptyList();

        if (booking.getGroupMembers() != null && !booking.getGroupMembers().isEmpty()) {
            memberIds = booking.getGroupMembers().stream()
                    .map(com.campusbooking.model.User::getId)
                    .toList();
            memberNames = booking.getGroupMembers().stream()
                    .map(com.campusbooking.model.User::getUsername)
                    .toList();
        }

        return BookingResponseDTO.builder()
                .bookingId(booking.getId())
                .userId(booking.getUser().getId())
                .username(booking.getUser().getUsername())
                .resourceId(booking.getResource().getId())
                .resourceName(booking.getResource().getName())
                .resourceType(booking.getResource().getType())
                .resourceLocation(booking.getResource().getLocation())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .status(effectiveStatus(booking, now))
                .groupMemberIds(memberIds)
                .groupMemberNames(memberNames)
                .groupBooking(!memberNames.isEmpty())
                .build();
    }

    private static Booking.Status effectiveStatus(Booking booking, LocalDateTime now) {
        boolean successful = booking.getStatus() == Booking.Status.APPROVED
                || booking.getStatus() == Booking.Status.CONFIRMED;
        if (successful && !booking.getEndTime().isAfter(now)) {
            return Booking.Status.COMPLETED;
        }
        return booking.getStatus();
    }
}
