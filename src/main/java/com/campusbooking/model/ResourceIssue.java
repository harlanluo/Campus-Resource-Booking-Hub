package com.campusbooking.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** Represents a student-reported problem with a campus resource. */
@Entity
@Table(name = "resource_issues")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @Column(nullable = false, length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.OPEN;

    @CreationTimestamp
    @Column(name = "reported_time", nullable = false, updatable = false)
    private LocalDateTime reportedTime;

    @Column(name = "resolved_time")
    private LocalDateTime resolvedTime;

    public enum Status {
        OPEN, RESOLVED
    }
}
