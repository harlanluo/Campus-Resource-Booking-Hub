COMPX576 Campus Resource Booking Hub
Project Proposal:

1. Introduction
   This project, "Campus Resource Booking Hub," is a responsive web application designed specifically for university students and administrators to efficiently manage and book campus resources, such as lab equipment (cameras, laptops) and meeting rooms. I chose this project after reviewing the existing university Resource Booker system and identifying areas for improvement from a student's perspective. The project aims to solve the limitations of current systems by introducing student-centric features like waitlisting for high-demand equipment, resource bundling for complex assignments, and collaborative group bookings, thereby making the campus resource management process more seamless, robust, and user-friendly.
2. Objectives/Goals
    Develop a fully functional role-based web application: Create distinct, secure interfaces and functionalities for 'Students' and 'Administrators'.
    Solve real-world concurrency issues: Ensure robust backend logic to prevent time-slot conflicts (dual-booking) when multiple students attempt to book the same resource simultaneously.
    Enhance user experience: Implement advanced booking features (Waitlist, Bundling, Group Bookings) to address specific pain points in student group work and practical assignments.
3. Requirements
   Functional Requirements:
    User authentication and role-based access control.
    Equipment and room catalog browsing with search/filter capabilities.
    Booking system with time-slot selection and availability checking.
    Automated downloadable PDF receipt generation upon booking approval.
    Admin dashboard for inventory management (Add/Update/Remove) and booking approval/rejection.
    Advanced booking features: Waitlist queueing, Project Kits, Group Bookings and Issue Reporting.
   Non-functional Requirements:
    Concurrency & Reliability: The system must handle simultaneous booking requests without data corruption or overlapping schedules.
    Security: Unauthorized access to admin endpoints must be strictly prevented.
    Usability: The interface must be responsive and intuitive.
    Maintainability: Code must be well-abstracted, documented, and follow proper programming style guidelines.
4. Functionality
    Core Student Features: Registration/Login, browse equipment, book available time slots, view personal booking history, download PDF receipts.
    Core Admin Features: Manage equipment inventory, approve/reject bookings, view system-wide orders.
    Waitlist & Auto-Notification: Users can join a queue for fully booked items. If a booking is canceled, the system auto-assigns the slot to the next person in the queue.
    Resource Bundling: "Project Kits" allowing students to book a pre-defined set of items (e.g., Camera + Tripod + Microphone) with a single click, checking availability for all items simultaneously.
    Collaborative Group Bookings: Students can add peers' Student IDs to a booking, allowing all group members to view and manage the reservation in their dashboards.
    Issue Reporting: A one-click "Report Issue" button for students to flag broken equipment or messy rooms, updating the resource status to "Needs Maintenance."
5. Tech Stack
    Backend: Java (Spring Boot) - for robust RESTful API creation and business logic handling.
    Frontend: HTML, CSS, and vanilla JavaScript (JS) - for building a responsive and interactive user interface.
    Database: Relational Database (MySQL for production simulation, or H2 for rapid local development/testing).
    Other Tools: Git, JUnit & Mockito (Testing), PDF generation library (e.g., iText).
6. Timeline/Schedule
    Week 1: System Design & Database Foundation
   Requirements gathering, ER diagram design, setting up the relational database schema, and defining table relations.
    Week 2: Backend Initialization & Auth
   Spring Boot project setup, user registration, and Multi-Role Access Control implementation.
    Week 3: Core CRUD Operations
   API endpoints for managing equipment inventory and basic catalog browsing.
    Week 4: Core Booking Logic
   Implementing booking creation and the critical Time-Slot Conflict Prevention algorithm.
    Week 5: Advanced Feature I
   Implementing Waitlist Queueing and Auto-Notification logic.
    Week 6: Advanced Feature II
   Implementing Resource Bundling and Collaborative Group Bookings.
    Week 7: Frontend Integration
   Developing HTML/CSS/JS UI and connecting the frontend with backend APIs.
    Week 8: Supplementary Features
   Implementing Issue Reporting functionality and Automated PDF Receipt generation.
    Week 9: Comprehensive Testing & Bug Tracking
   Writing unit/integration tests, implementing formal bug tracking, and resolving edge-case errors.
    Week 10: Deployment & Documentation
   Final project deployment, code cleanup, final UI polish, and completion of the Final Project Summary report.
7. Deployment Plan
   For the scope of this academic project, the application will be designed for local deployment to ensure ease of testing and assessment. The project will leverage Spring Boot's embedded Tomcat server, making the application self-contained. For the database, I plan to use an embedded H2 database (or local MySQL) so that no complex external database configuration is required by the user.
   The final project will be made "live and accessible" to the assessor via a submitted .zip file containing the complete source code, accompanied by a README.md file. This documentation will provide simple, one-click build and run instructions (e.g., using Maven/Gradle wrappers) to easily launch the application on localhost.
8. Testing Plan
   Testing and quality assurance are core focuses to ensure system reliability and security.
    Unit Testing: JUnit will be used to test individual service methods, ensuring core logic behaves correctly.
    Integration Testing: Tests will be written to simulate concurrent user requests to strictly verify the Time-Slot Conflict Prevention and Waitlist logic.
    Security & Vulnerability Testing: Ensuring role-based access works correctly (e.g., preventing unauthorized students from accessing admin endpoints or manipulating other users' data).
    Manual UI Testing: Going through the user journey steps to ensure the frontend is intuitive and handles errors gracefully (e.g., displaying user-friendly error messages if a booking fails).
9. Conclusion
   The Campus Resource Booking Hub aims to provide a superior, student-friendly alternative to traditional booking systems. By starting with a solid database architecture in Week 1 and progressively building advanced technical features like conflict prevention, waitlists, and group sharing, this project will not only solve real campus administrative challenges but also demonstrate a deep understanding of full-stack development, database management, and system architecture.

 
Progress Report for Week One

1. Achievements in the Last Week:
   • Project Definition: Successfully defined the project scope, objectives, and functionality for the "Campus Resource Booking Hub" and completed the Project Proposal.
   • Database Design (ER Schema): Designed the core relational database architecture required for the system, identifying 5 key entities: users, resources, bookings, waitlists, and group_booking_members.
   • SQL Scripts Generation: Successfully wrote the Database Definition Language (DDL) to create tables with proper constraints and foreign keys (schema.sql), as well as generated realistic mock data (data.sql) for future testing.
2. New Challenges Encountered & Handled:
   • Challenge: Mapping the complex business logic (e.g., Collaborative Group Bookings) into a relational database structure.
   • Solution: Overcame this by researching relational database design and implementing a many-to-many junction table (group_booking_members) using a composite primary key to link users and bookings effectively.
3. Plans for Week Two:
   • Initialize the Java Spring Boot backend project structure.
   • Configure the database connection (H2 embedded database for development).
   • Create JPA/Hibernate Entity classes corresponding to the database tables.
   • Implement foundational User authentication (Login/Registration) logic if time permits.

Progress Report for Week Two

1. Achievements in the Last Week:
   • Project Initialization: Successfully set up the Spring Boot project using Maven, importing necessary dependencies such as Spring Web, Spring Data JPA, H2 Database, and Lombok.
   • Database Integration: Configured the embedded H2 database to automatically execute the schema.sql and data.sql scripts on startup.
   • JPA Entities & Repositories: Mapped the relational database schema into Java objects. Created Entity classes (User, Resource, Booking, Waitlist) and their respective Spring Data JPA Repositories.
   • RESTful APIs Implemented: Developed the Service and Controller layers to expose core endpoints:
   o GET /api/resources
   o GET /api/resources/available
   o POST /api/users/register and POST /api/users/login
2. New Challenges Encountered & Handled:
   • Challenge: Encountered minor issues with Maven dependency downloads and environment variable configurations during the initial Spring Boot build.
   • Solution: Handled it by cleaning the Maven cache and reloading the project dependencies. Successfully verified the build by testing the endpoints via the browser.
3. Plans for the Next Week (Week Three):
   • Focus on the Core Booking Logic: Implement the POST /api/bookings endpoint.
   • Develop the Time-Slot Conflict Prevention algorithm to ensure resources cannot be double-booked.
   • Start implementing the basic Waitlist auto-queue logic.
