package com.campusbooking.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

/**
 * Represents a pre-configured Resource Bundle / Project Kit
 * (e.g., "Media Production Kit" containing Camera, Tripod, Mic).
 * Maps to the {@code kits} table in schema.sql.
 */
@Entity
@Table(name = "kits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Kit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    /**
     * Set of bookable campus resources bundled in this project kit.
     * Maps to the {@code kit_items} join table.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "kit_items",
        joinColumns        = @JoinColumn(name = "kit_id"),
        inverseJoinColumns = @JoinColumn(name = "resource_id")
    )
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Resource> resources = new HashSet<>();
}
