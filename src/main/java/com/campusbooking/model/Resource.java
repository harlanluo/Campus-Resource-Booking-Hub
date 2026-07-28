package com.campusbooking.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Represents a bookable campus resource (room, lab, equipment, etc.).
 * Maps to the {@code resources} table in schema.sql.
 */
@Entity
@Table(name = "resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    /**
     * Free-form type label (e.g. ROOM, LAB, EQUIPMENT).
     * Kept as a plain String rather than an enum so admins can add
     * new resource types without a code change.
     */
    @Column(nullable = false, length = 50)
    private String type;

    @Column(length = 500)
    private String description;

    /**
     * Availability status of the resource.
     * Stored as a VARCHAR(20) matching the CHECK constraint in schema.sql.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    public enum Status {
        AVAILABLE, UNAVAILABLE, MAINTENANCE
    }
}
