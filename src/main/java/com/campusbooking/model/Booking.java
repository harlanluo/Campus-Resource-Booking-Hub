package com.campusbooking.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Represents a resource booking made by a user.
 * Maps to the {@code bookings} table in schema.sql.
 *
 * <p>The many-to-many relationship with {@link User} for collaborative
 * group bookings is managed via the {@code group_booking_members} join table.</p>
 */
@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The user who created this booking. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** The resource being booked. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    /**
     * Lifecycle status of the booking.
     * Stored as VARCHAR(20) to match the CHECK constraint in schema.sql.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PENDING;

    /**
     * Additional group members for collaborative bookings.
     * Maps to the {@code group_booking_members} join table.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "group_booking_members",
        joinColumns        = @JoinColumn(name = "booking_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    @ToString.Exclude   // avoid circular toString with User
    @EqualsAndHashCode.Exclude
    private Set<User> groupMembers = new HashSet<>();

    public enum Status {
        PENDING, CONFIRMED, CANCELLED, COMPLETED
    }
}
