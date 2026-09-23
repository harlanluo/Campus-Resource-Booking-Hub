# Current ER diagram

This Mermaid ER diagram is the maintainable source for the current persistent model. It is derived from `src/main/resources/schema.sql` and cross-checked against the JPA entities in `src/main/java/com/campusbooking/model`. Association tables are shown explicitly so the foreign keys and composite keys remain clear.

```mermaid
erDiagram
    users ||--o{ bookings : creates
    resources ||--o{ bookings : occupies
    kit_bookings o|--o{ bookings : contains
    kits ||--o{ kit_bookings : reserves
    users ||--o{ kit_bookings : owns
    users ||--o{ waitlists : requests
    resources ||--o{ waitlists : requested_for
    resources ||--o{ resource_issues : has
    users ||--o{ resource_issues : reports
    bookings ||--o{ group_booking_members : has
    users ||--o{ group_booking_members : joins
    kits ||--o{ kit_items : includes
    resources ||--o{ kit_items : bundled_in
    kit_bookings ||--o{ kit_booking_members : has
    users ||--o{ kit_booking_members : joins

    users {
        BIGINT id PK
        VARCHAR username UK
        VARCHAR password
        VARCHAR email UK
        VARCHAR role
    }

    resources {
        BIGINT id PK
        VARCHAR name UK
        VARCHAR type
        VARCHAR description
        VARCHAR location
        INTEGER capacity
        BOOLEAN manual_maintenance
        VARCHAR status
    }

    kits {
        BIGINT id PK
        VARCHAR name UK
        VARCHAR description
    }

    kit_items {
        BIGINT kit_id PK
        BIGINT resource_id PK
    }

    kit_bookings {
        BIGINT id PK
        VARCHAR booking_reference UK
        BIGINT kit_id FK
        BIGINT user_id FK
        DATETIME start_time
        DATETIME end_time
        VARCHAR status
        INTEGER resource_count
        DATETIME created_at
        DATETIME updated_at
    }

    kit_booking_members {
        BIGINT kit_booking_id PK
        BIGINT user_id PK
    }

    bookings {
        BIGINT id PK
        BIGINT user_id FK
        BIGINT resource_id FK
        BIGINT kit_booking_id FK
        DATETIME start_time
        DATETIME end_time
        VARCHAR status
    }

    group_booking_members {
        BIGINT booking_id PK
        BIGINT user_id PK
    }

    waitlists {
        BIGINT id PK
        BIGINT user_id FK
        BIGINT resource_id FK
        DATETIME requested_start
        DATETIME requested_end
        DATETIME request_time
        VARCHAR status
        DATETIME offered_at
        DATETIME offer_expires_at
        DATETIME closed_at
    }

    resource_issues {
        BIGINT id PK
        BIGINT resource_id FK
        BIGINT reporter_id FK
        VARCHAR description
        VARCHAR status
        DATETIME reported_time
        DATETIME resolved_time
    }
```

## Relationship notes

- `bookings` is the resource-occupancy table. A nullable `kit_booking_id` identifies child holds belonging to a parent `kit_bookings` row.
- `group_booking_members` links additional users to a standard booking; `kit_booking_members` provides the equivalent parent-level relationship for a Project Kit reservation.
- `kit_items` defines the resources included in a Kit.
- `waitlists` stores the exact resource and requested interval plus the offer lifecycle timestamps.
- `resource_issues` links a Student reporter to a resource and stores the issue/maintenance lifecycle.

The old root diagram was created before the final Kit, issue, availability, and exact-slot Waitlist model. It is retained only for historical reference as `docs/ER-Diagram-Historical.png`; this file is the authoritative editable diagram source for the current repository.
