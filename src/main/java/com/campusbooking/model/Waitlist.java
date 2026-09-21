package com.campusbooking.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** A student's request for one exact resource and time interval. */
@Entity
@Table(name = "waitlists")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Waitlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The user waiting for this resource. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** The resource the user is waiting for. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @Column(name = "requested_start", nullable = false)
    private LocalDateTime requestedStart;

    @Column(name = "requested_end", nullable = false)
    private LocalDateTime requestedEnd;

    /**
     * Timestamp when the waitlist request was submitted.
     * Defaults to the current timestamp, matching the SQL DEFAULT CURRENT_TIMESTAMP.
     */
    @CreationTimestamp
    @Column(name = "request_time", nullable = false, updatable = false)
    private LocalDateTime requestTime;

    /**
     * Current status of the waitlist entry.
     * Stored as VARCHAR(20) to match the CHECK constraint in schema.sql.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.WAITING;

    @Column(name = "offered_at")
    private LocalDateTime offeredAt;

    @Column(name = "offer_expires_at")
    private LocalDateTime offerExpiresAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    public enum Status {
        WAITING, OFFERED, ACCEPTED, DECLINED, EXPIRED, LEFT
    }
}
