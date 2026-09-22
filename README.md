# Campus Resource Booking Hub

Campus Resource Booking Hub is a full-stack academic web application for finding, booking, and managing shared university resources. Students and administrators use authenticated, role-based workspaces to manage rooms, specialist labs, equipment, group bookings, Project Kits, waitlists, and maintenance reporting.

## Key Features

- Real Login, Register, and Logout with BCrypt passwords, HTTP sessions, session restoration, and Student/Admin role-based workspaces
- A catalogue of 21 standard resources and 4 Project Kits, including location and capacity metadata, local Room/Lab/Kit images, and equipment icons
- Student resource browsing and administrator resource inventory management
- Two booking paths: `Find availability` chooses a date and time first; `Resources` chooses a resource first
- Weekly availability calendar with selectable time slots and clear booked, awaiting-approval, held, and maintenance/unavailable states
- Booking approval, cancellation, and history workflows, with downloadable PDF receipts
- Group bookings with owner and group-member access checks
- Slot-aware Waitlist requests for a specific resource and time interval; a temporary offer can be accepted or declined, and only acceptance creates a pending booking
- First-class parent-level Project Kit reservations, with child resource holds managed atomically under one approval, cancellation, and receipt
- Student issue reporting and an administrator maintenance-resolution workflow
- Pessimistic row locking and conflict prevention for concurrent single-resource and Project Kit requests

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

The local H2 console is available at [http://localhost:8080/h2-console](http://localhost:8080/h2-console). Its JDBC URL is `jdbc:h2:mem:campusdb`, its username is `sa`, and its password is blank. It is intended for local development only.

## Demo Accounts

These seeded credentials are for the local academic demonstration only; they are not personal or production accounts. Enter them on the Login screen to authenticate normally. The application also provides student registration, logout, and session restoration.

| Role | Username | Password |
|---|---|---|
| Student | `alice_student` | `password123` |
| Administrator | `bob_admin` | `password123` |

## Running Tests

Run the clean automated test suite from the repository root:

```bash
mvn clean test
```

The current committed baseline has 168 passing tests with no failures, errors, or skipped tests.

## Project Structure

- `src/main/java/com/campusbooking/controller` - REST endpoints for users, resources, bookings, kits, waitlists, and issues
- `src/main/java/com/campusbooking/service` - transactional business rules, PDF receipts, conflict checks, and workflow coordination
- `src/main/java/com/campusbooking/repository` - Spring Data JPA queries and pessimistic resource locks
- `src/main/java/com/campusbooking/security` and `config` - identity checks, role rules, session authentication, and application configuration
- `src/main/resources` - runtime configuration, database scripts, and the HTML/CSS/JavaScript interface
- `src/test/java/com/campusbooking` - unit, MVC, security, integration, and concurrency tests
- `BUG_TRACKING.md` - historical booking-concurrency defects and regression-test references

## Testing and Quality Assurance

Service unit tests check booking validation, parent-level Project Kit atomicity, slot-aware Waitlist behavior, issue handling, maintenance state, and receipt generation. MVC and Spring Boot integration tests exercise secured endpoints, authentication and session workflows, role restrictions, booking ownership, group-member access, PDF downloads, and core workflows. Multi-threaded tests verify that concurrent requests produce one valid winner without duplicate or partial reservations. The suite currently passes 168 tests.

## Known Limitations

- The application uses an in-memory H2 database, so data does not persist after the application process stops.
- CSRF and CORS settings remain development-oriented and require production hardening.
- This is an academic, local prototype rather than a production deployment.

## Academic Context

This project was developed for COMPX576 as part of the Master of Information Technology programme at the University of Waikato. It is an academic project and does not claim any wider affiliation with the university.
