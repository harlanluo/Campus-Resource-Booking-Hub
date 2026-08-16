package com.campusbooking.dto;

import com.campusbooking.model.Waitlist;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Response body returned after joining or querying the waitlist.
 *
 * <p>Exposes only the data the client needs; sensitive user fields
 * (e.g. passwords) are intentionally excluded.</p>
 */
@Data
@Builder
public class WaitlistResponseDTO {

    /** Database-generated waitlist entry identifier. */
    private Long id;

    // ── User summary ──────────────────────────────────────────────────────────

    /** ID of the waiting user. */
    private Long userId;

    /** Username of the waiting user. */
    private String username;

    // ── Resource summary ──────────────────────────────────────────────────────

    /** ID of the resource being waited on. */
    private Long resourceId;

    /** Human-readable name of the resource being waited on. */
    private String resourceName;

    // ── Waitlist metadata ─────────────────────────────────────────────────────

    /** Timestamp when this entry was created (determines queue position). */
    private LocalDateTime requestTime;

    /** Current status of the waitlist entry. */
    private Waitlist.Status status;

    // ── Factory ───────────────────────────────────────────────────────────────

    /**
     * Convenience factory that maps a {@link Waitlist} entity to this DTO.
     *
     * @param waitlist the persisted waitlist entity
     * @return a fully-populated {@code WaitlistResponseDTO}
     */
    public static WaitlistResponseDTO from(Waitlist waitlist) {
        return WaitlistResponseDTO.builder()
                .id(waitlist.getId())
                .userId(waitlist.getUser().getId())
                .username(waitlist.getUser().getUsername())
                .resourceId(waitlist.getResource().getId())
                .resourceName(waitlist.getResource().getName())
                .requestTime(waitlist.getRequestTime())
                .status(waitlist.getStatus())
                .build();
    }
}
