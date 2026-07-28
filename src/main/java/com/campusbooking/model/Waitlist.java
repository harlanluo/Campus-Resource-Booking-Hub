package com.campusbooking.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Represents a waitlist entry for a fully-booked resource.
 * Maps to the {@code waitlists} table in schema.sql.
 */
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

    public enum Status {
        WAITING, PROMOTED, CANCELLED
    }
}
