# Campus Resource Booking Hub

Campus Resource Booking Hub is a full-stack academic web application for discovering and requesting time-based reservations for shared campus resources. Authenticated Students can browse rooms, labs, equipment, and Project Kits, while Admins review requests, manage inventory, and coordinate maintenance work. The seeded locations and resource images are local demonstration data; this repository does not integrate with University of Waikato systems or represent verified room assignments.

## Key features

### Student workspace

- Student registration, login, logout, session restoration, and role-based workspace access.
- Dashboard, upcoming bookings, booking history, optional group members, cancellation, and ownership-aware access.
- Time-first **Find availability**: choose a date, start time, duration, resource type, optional capacity, and keyword, then review matching resources or Project Kits.
- Resource-first browsing: filter the catalogue, open Resource Detail, inspect location/capacity/status, and use the standalone Weekly Availability view to choose a slot.
- Room, lab, equipment, and Project Kit browsing with operational/maintenance state shown to the user.
- Booking requests that remain **Awaiting approval** until an Admin reviews them.
- PDF receipts for eligible approved standalone bookings and first-class Project Kit reservations.
- Exact-slot Waitlist requests, temporary offers, offer acceptance/decline, and in-app offer history.
- Resource issue reporting and a Student's own issue history.

### Admin workspace

- Admin Overview with pending approvals, current reservations, resource health, Project Kit context, and issue activity.
- Approval or rejection of standard booking requests and parent-level Project Kit requests, plus reservation/history views.
- Resource inventory management: add, update, delete where permitted, mark a resource for maintenance, and return it to operational status.
- Project Kit catalogue/readiness context and one parent-level reservation workflow; Kit definitions themselves are seeded in this version.
- Issue review with approve, reject, and resolve actions, together with the supported resource maintenance lifecycle.
- Aggregate Waitlist context showing exact requested slots, queue size, offer state, expiry, and no Student identities.

## Booking lifecycle

Student submissions create requests; they are not immediately confirmed. The current user-facing mapping for a standard booking is:

| Backend state | User-facing meaning |
|---|---|
| `PENDING` | Awaiting approval |
| `APPROVED` / legacy `CONFIRMED` | Confirmed |
| Successful past reservation | Completed |
| `REJECTED` | Rejected |
| `CANCELLED` | Cancelled |

`Completed` is an effective status for an approved/confirmed reservation whose end time has passed. Admin approval is still required after a normal Student booking request is submitted. Project Kit parents follow the same approval concept and are displayed as one reservation.

## Two complementary Student booking paths

The application intentionally supports two starting points:

1. **Time-first:** `Find availability` → choose date, start time, duration, and need/type → see resources or Kits available for that interval → review the request → submit.
2. **Resource-first:** `Resources` → open `Resource Detail` → `Weekly Availability` → choose an available slot and duration → review the request → submit.

The first path answers **“What can I book at this time?”** The second answers **“When is this resource available?”** They share the same server-side conflict validation and approval workflow; they are not duplicate pages.

## Exact-slot Waitlist

The Waitlist is not a generic “notify me whenever this room is free” queue. Each request is tied to one resource and one exact requested start/end interval.

- A Student enters `WAITING` only for an exact interval that is currently blocked.
- When that exact blocking interval is released, the next eligible waiter for the same resource and exact start/end may become `OFFERED`.
- An offer has an expiry and temporarily holds the interval so another normal booking cannot take it while the Student decides.
- The Student must **Accept** or **Decline**. Accepting creates a normal `PENDING` booking request; Admin approval is still required.
- Declining or allowing an offer to expire can promote the next eligible exact-slot waiter.
- Admins can see aggregate slot, queue, and offer context, but the Admin workflow does not force-accept a Waitlist request for a Student.

Releases caused by cancellation, rejection, or a released Project Kit child interval use the same exact-slot promotion rules. The local offer duration is configured as 15 minutes in `application.properties`.

## Project Kits

Project Kits are first-class reservations rather than loose frontend bundles:

- A Kit contains multiple resources through the `kit_items` relationship.
- A Kit is available only when the intersection of all included resource intervals is available and every included resource is operational.
- One parent `KitBooking` is shown to the Student and Admin. The child `bookings` rows are internal resource reservations/holds, not separate Student bookings.
- Creation validates and locks every included resource before persisting the parent and all child rows, so the reservation is atomic.
- Resources are locked in deterministic ID order to avoid inconsistent partial Kit bookings under concurrency.
- Kit readiness follows the operational status of its included resources.
- Approval, rejection, cancellation, group members, and the PDF receipt operate through the single parent reservation flow.

## Issue reporting and maintenance

Students can report an issue against a resource and view their own issue history. Admins can review all reports:

- Approving a `PENDING` report changes it to `OPEN` and places the resource in `MAINTENANCE`.
- Rejecting a report changes it to `REJECTED` and leaves the resource status unchanged.
- Resolving an `OPEN` report changes it to `RESOLVED`. If no other open issue remains and the resource was not manually placed in maintenance, the resource returns to `AVAILABLE`.
- A manual maintenance decision is preserved; resolving an issue does not silently clear it. Admins can also change operational status directly.

## Booking integrity and concurrency design

Booking rules are enforced in the backend service layer, not only in the browser. For a standard reservation, the service locks the resource row, revalidates the resource status and requested interval, checks overlapping `PENDING`, `APPROVED`, and legacy `CONFIRMED` bookings, checks active Waitlist offers, and only then inserts the booking. The transaction covers the check-and-create sequence.

Project Kit creation locks all child resources in ascending ID order and persists the parent plus child reservations as one transaction. Kit transitions validate the complete child set before changing the parent and children together. Waitlist release, offer expiry, acceptance, and promotion lock the relevant resource/Waitlist rows and recheck conflicts before advancing the exact-slot workflow.

These are local H2 transaction and row-locking guarantees. The project does not claim distributed locking or production-scale clustering.

## Architecture and technology

The main request flow is:

```text
Browser SPA (HTML/CSS/vanilla JavaScript)
    -> REST controllers and DTOs
    -> Spring Security session authentication
    -> transactional service layer
    -> Spring Data JPA repositories
    -> H2 database initialised by schema.sql and data.sql
```

The repository uses Java 17 and Spring Boot 3.3.2. The main technologies are:

- Spring Web/MVC, Bean Validation, Spring Data JPA/Hibernate, and Spring Security.
- H2 in-memory database with explicit SQL schema/seed scripts and `spring.jpa.hibernate.ddl-auto=none`.
- Apache PDFBox 3.0.8 for standalone and Project Kit receipt generation.
- Maven, Lombok, JUnit 5, Mockito, AssertJ, Spring MockMvc, and Spring Security Test.
- A single-page interface built with HTML, CSS, and vanilla JavaScript.

Business rules for booking, availability, Kits, Waitlists, issue handling, and authorization are implemented in the Java service/backend layers. The frontend provides the workflow and advisory availability view but is not the final integrity authority.

## Repository layout

- `src/main/java/com/campusbooking/controller` - REST endpoints for users, resources, bookings, Kits, Waitlists, and issues.
- `src/main/java/com/campusbooking/service` - transactional booking rules, availability, maintenance, receipts, and workflow coordination.
- `src/main/java/com/campusbooking/repository` - Spring Data JPA queries and pessimistic-locking entry points.
- `src/main/java/com/campusbooking/model` and `dto` - persistent entities and safe API projections.
- `src/main/resources` - application configuration, schema/seed SQL, and the HTML/CSS/JavaScript SPA.
- `src/test/java/com/campusbooking` - service, MVC, security, integration, workflow, and concurrency tests.
- `docs` - the current editable ER source and explicitly labelled historical diagram.

## Security model

- Passwords are stored using BCrypt through Spring Security's password encoder.
- Login creates an HTTP session; later API calls use that authenticated session.
- Users have `STUDENT`, `STAFF`, or `ADMIN` roles in the model; public self-registration creates Student accounts.
- Backend method authorization protects Admin endpoints and checks ownership/participation for Student booking, Kit, receipt, Waitlist, and issue data.
- Students receive their own protected booking, Waitlist, and issue records; Admins can access the operational queues.
- Local H2 console access is restricted to Admins. CSRF is disabled and CORS accepts localhost origins for this academic local setup; these settings require hardening before any production deployment.

## Demo access

These are intentional local assessment credentials exposed by the Login UI. They are not personal or production accounts.

| Role | Username | Password |
|---|---|---|
| Student | `alice_student` | `password123` |
| Admin | `bob_admin` | `password123` |

## Running locally

### Requirements

- JDK 17.
- Apache Maven available on the command line.

From the project root (`Campus-Booking-Hub`):

```bash
mvn spring-boot:run
```

Open [http://localhost:8080](http://localhost:8080) and use either the Login screen or one of the demo accounts above. The application uses an in-memory H2 database at `jdbc:h2:mem:campusdb`; `schema.sql` and `data.sql` are applied at startup, so local data resets when the application stops. The H2 console is available at [http://localhost:8080/h2-console](http://localhost:8080/h2-console) for an Admin session, using JDBC URL `jdbc:h2:mem:campusdb`, username `sa`, and a blank password.

## Testing and QA

Run the automated suite from the project root:

```bash
mvn clean test
```

The verified baseline for this documentation pass is **174 tests passing, 0 failures, 0 errors, and 0 skipped**. The test suite covers:

- Service and repository behavior for bookings, availability search, resource status, receipts, Project Kits, Waitlists, and issue handling.
- Controller/MVC and Spring Boot integration workflows, including booking lifecycle and availability search.
- Security, authentication, role restrictions, ownership, group-member access, and protected receipt/data endpoints.
- Multi-threaded booking and Project Kit concurrency/integrity scenarios.
- Exact-slot Waitlist promotion, offer expiry, acceptance, decline, and conflict behavior.

Final QA also covered Student and Admin end-to-end journeys, normal booking, Project Kits, exact-slot Waitlists, issue reporting, maintenance, PDF receipts, authorization, desktop/mobile/accessibility checks, JavaScript syntax, and repository diff whitespace. Those browser/manual checks are separate from the Maven test count and were completed within the audited local scope with no confirmed release blocker.

## Current data and scope

The seed scripts provide 21 standard resources and 4 Project Kits, including illustrative location, capacity, status, and image metadata. These values make the local workflows demonstrable; they are not a live campus catalogue.

Known limitations:

- H2 is an in-memory demonstration database; there is no production database or deployment configuration.
- There are no email or push notifications, recurring bookings, or calendar export.
- Project Kit definitions are seeded/read-only in the current application; Admins manage Kit readiness and reservations rather than editing Kit membership through the UI.
- Seeded locations and generated resource images are local illustrative assets, not verified University of Waikato room assignments or photographs.
- The security/CORS configuration is suitable for the audited local academic scope and needs production hardening.

Screenshots are intentionally omitted from this README; final-report screenshots and captions belong to the separate course-report stage.

## Repository notes

- [Current ER model source](docs/ER-Diagram.md) is the maintainable schema/entity reference. A prior diagram is retained only as a historical artifact under `docs/ER-Diagram-Historical.png`.
- [process-report.md](process-report.md) and [BUG_TRACKING.md](BUG_TRACKING.md) preserve the project's historical development and defect narrative. They are not the source of current feature claims.

## Academic context

This repository is the COMPX576 academic project for the Master of Information Technology programme at the University of Waikato. It is a local academic demonstration and does not claim integration with University systems or commercial/production deployment.
