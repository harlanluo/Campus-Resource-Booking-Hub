# Campus Resource Booking Hub

Campus Resource Booking Hub is a full-stack academic web application for finding, booking, and managing shared university resources. It brings rooms, equipment, group bookings, waitlists, maintenance reporting, and administrative approval into one local system.

## Key Features

- Student and administrator authentication with BCrypt passwords, HTTP sessions, and role-based API access
- Campus resource browsing and administrator inventory management
- Booking validation and time-slot conflict prevention, including approved bookings
- Collaborative group bookings with owner and group-member access checks
- FIFO waitlists with automatic promotion into a pending booking when a slot is released
- Project Kits that reserve several related resources as one all-or-nothing operation
- Downloadable PDF receipts for approved bookings
- Student issue reporting and an administrator maintenance-resolution workflow
- Pessimistic row locking for concurrent single-resource and Project Kit requests

## Technical Highlights

- Layered Spring Boot design with controller, service, repository, DTO, model, security, and exception-handling packages
- REST APIs backed by Spring Data JPA, Hibernate, and an embedded H2 database
- Transactional booking, waitlist, issue, and Project Kit operations
- Pessimistic resource locks that serialize conflict checking and booking creation
- Stable lock ordering and atomic transactions for multi-resource Project Kit reservations
- Unit, MVC, security, integration, workflow, and real multi-threaded concurrency tests

## Tech Stack

- Java 17
- Spring Boot 3.3.2
- Spring Web, Spring Data JPA, Spring Security, and Bean Validation
- H2 in-memory database with SQL schema and seed scripts
- Apache PDFBox 3.0.8
- Maven
- JUnit 5, Mockito, AssertJ, Spring MockMvc, and Spring Security Test
- HTML, CSS, and vanilla JavaScript

## Running the Project

### Prerequisites

- JDK 17
- Apache Maven available from the command line

From the repository root, start the application with:

```bash
mvn spring-boot:run
```

Open [http://localhost:8080](http://localhost:8080) in a browser. The application creates and seeds its in-memory H2 database from `src/main/resources/schema.sql` and `src/main/resources/data.sql` each time it starts.

The local H2 console is available at [http://localhost:8080/h2-console](http://localhost:8080/h2-console) for the administrator demo profile. Its JDBC URL is `jdbc:h2:mem:campusdb`, its username is `sa`, and its password is blank.

## Demo Accounts

These credentials are seeded only for this local academic demonstration. They are not personal or production accounts.

| Role | Username | Password |
|---|---|---|
| Student | `alice_student` | `password123` |
| Administrator | `bob_admin` | `password123` |

The interface signs in with the selected demo profile so its actions use the same authenticated HTTP session as the REST API.

## Running Tests

Run the clean automated test suite from the repository root:

```bash
mvn clean test
```

The current Week 8 suite has 81 verified passing tests with no failures, errors, or skipped tests.

## Project Structure

- `src/main/java/com/campusbooking/controller` - REST endpoints for users, resources, bookings, kits, waitlists, and issues
- `src/main/java/com/campusbooking/service` - transactional business rules, PDF receipts, conflict checks, and workflow coordination
- `src/main/java/com/campusbooking/repository` - Spring Data JPA queries and pessimistic resource locks
- `src/main/java/com/campusbooking/security` and `config` - identity checks, role rules, session authentication, and application configuration
- `src/main/resources` - runtime configuration, database scripts, and the HTML/CSS/JavaScript interface
- `src/test/java/com/campusbooking` - unit, MVC, security, integration, and concurrency tests
- `BUG_TRACKING.md` - verified Week 8 race conditions, fixes, and regression-test references

## Testing and Quality Assurance

Service unit tests check booking validation, Project Kit atomicity, waitlist behavior, issue handling, maintenance state, and receipt generation. MVC and Spring Boot integration tests exercise secured endpoints, login sessions, role restrictions, booking ownership, group-member access, PDF downloads, and core workflows. Repeated multi-threaded tests verify that concurrent requests produce one valid winner without duplicate or partial reservations. Verified concurrency defects and their regression coverage are recorded in `BUG_TRACKING.md`.

## Known Limitations

- The application is a local academic prototype and uses an in-memory H2 database, so data does not persist after the application process stops.
- The profile selector uses the shared seeded demo password to make local role switching quick. A production system would use a dedicated sign-in screen and user-managed credentials.
- CSRF protection is disabled for the local JSON API, and CORS is configured for localhost development. Both settings would need production hardening before deployment.
- Waitlist entries do not collect a preferred time range; automatic promotion assigns the exact slot released by a cancelled booking.

## Academic Context

This project was developed for COMPX576 as part of the Master of Information Technology programme at the University of Waikato. It is an academic project and does not claim any wider affiliation with the university.
