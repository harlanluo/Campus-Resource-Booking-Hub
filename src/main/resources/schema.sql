-- Database Schema for Campus Booking Hub
-- Compatible with H2 and MySQL

-- Users table for both students and admins
CREATE TABLE IF NOT EXISTS users (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50)  NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email    VARCHAR(100) NOT NULL UNIQUE,
    role     VARCHAR(20)  NOT NULL DEFAULT 'STUDENT'
        CHECK (role IN ('STUDENT', 'STAFF', 'ADMIN'))
);

-- Resources like meeting rooms or equipments
CREATE TABLE IF NOT EXISTS resources (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    type        VARCHAR(50)  NOT NULL,
    description VARCHAR(500),
    status      VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE'))
);

-- Main bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    resource_id BIGINT       NOT NULL,
    start_time  DATETIME     NOT NULL,
    end_time    DATETIME     NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'APPROVED', 'REJECTED')),
    CONSTRAINT fk_bookings_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
    CONSTRAINT fk_bookings_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    CONSTRAINT chk_booking_time     CHECK (end_time > start_time)
);

-- Waitlist queue for fully booked items
CREATE TABLE IF NOT EXISTS waitlists (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT      NOT NULL,
    resource_id  BIGINT      NOT NULL,
    request_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status       VARCHAR(20) NOT NULL DEFAULT 'WAITING'
        CHECK (status IN ('WAITING', 'PROMOTED', 'CANCELLED')),
    CONSTRAINT fk_waitlist_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
    CONSTRAINT fk_waitlist_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);

-- Junction table for group collaborative bookings (Many-to-Many)
CREATE TABLE IF NOT EXISTS group_booking_members (
    booking_id BIGINT NOT NULL,
    user_id    BIGINT NOT NULL,
    PRIMARY KEY (booking_id, user_id),
    CONSTRAINT fk_gbm_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_gbm_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

-- Pre-configured Resource Bundles / Project Kits
CREATE TABLE IF NOT EXISTS kits (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500)
);

-- Junction table linking kits with bundled resources
CREATE TABLE IF NOT EXISTS kit_items (
    kit_id      BIGINT NOT NULL,
    resource_id BIGINT NOT NULL,
    PRIMARY KEY (kit_id, resource_id),
    CONSTRAINT fk_kit_items_kit      FOREIGN KEY (kit_id)      REFERENCES kits(id)      ON DELETE CASCADE,
    CONSTRAINT fk_kit_items_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);