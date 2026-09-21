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
    manual_maintenance BOOLEAN NOT NULL DEFAULT FALSE,
    status      VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE'))
);

-- Pre-configured Resource Bundles / Project Kits
CREATE TABLE IF NOT EXISTS kits (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500)
);

-- Product-level Project Kit reservations
CREATE TABLE IF NOT EXISTS kit_bookings (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(30) UNIQUE,
    kit_id            BIGINT       NOT NULL,
    user_id           BIGINT       NOT NULL,
    start_time        DATETIME     NOT NULL,
    end_time          DATETIME     NOT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
    resource_count    INT          NOT NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_kit_bookings_kit  FOREIGN KEY (kit_id)  REFERENCES kits(id),
    CONSTRAINT fk_kit_bookings_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_kit_booking_time CHECK (end_time > start_time)
);

-- Parent-level participants for Project Kit reservations
CREATE TABLE IF NOT EXISTS kit_booking_members (
    kit_booking_id BIGINT NOT NULL,
    user_id        BIGINT NOT NULL,
    PRIMARY KEY (kit_booking_id, user_id),
    CONSTRAINT fk_kbm_kit_booking FOREIGN KEY (kit_booking_id) REFERENCES kit_bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_kbm_user        FOREIGN KEY (user_id)        REFERENCES users(id)
);

-- Main bookings table (kit-linked rows remain the resource occupancy source)
CREATE TABLE IF NOT EXISTS bookings (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    resource_id BIGINT       NOT NULL,
    kit_booking_id BIGINT,
    start_time  DATETIME     NOT NULL,
    end_time    DATETIME     NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'APPROVED', 'REJECTED')),
    CONSTRAINT fk_bookings_user     FOREIGN KEY (user_id)     REFERENCES users(id),
    CONSTRAINT fk_bookings_resource FOREIGN KEY (resource_id) REFERENCES resources(id),
    CONSTRAINT fk_bookings_kit      FOREIGN KEY (kit_booking_id) REFERENCES kit_bookings(id),
    CONSTRAINT uq_kit_booking_resource UNIQUE (kit_booking_id, resource_id),
    CONSTRAINT chk_booking_time     CHECK (end_time > start_time)
);

-- Slot-aware waitlist requests and temporary offers
CREATE TABLE IF NOT EXISTS waitlists (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT      NOT NULL,
    resource_id  BIGINT      NOT NULL,
    requested_start DATETIME  NOT NULL,
    requested_end   DATETIME  NOT NULL,
    request_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status       VARCHAR(20) NOT NULL DEFAULT 'WAITING'
        CHECK (status IN ('WAITING', 'OFFERED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'LEFT')),
    offered_at       DATETIME,
    offer_expires_at DATETIME,
    closed_at        DATETIME,
    CONSTRAINT fk_waitlist_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
    CONSTRAINT fk_waitlist_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    CONSTRAINT chk_waitlist_time CHECK (requested_end > requested_start)
);

-- Student-reported resource issues and their maintenance lifecycle
CREATE TABLE IF NOT EXISTS resource_issues (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    resource_id   BIGINT       NOT NULL,
    reporter_id   BIGINT       NOT NULL,
    description   VARCHAR(500) NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'OPEN', 'REJECTED', 'RESOLVED')),
    reported_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_time DATETIME,
    CONSTRAINT fk_issue_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    CONSTRAINT fk_issue_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Junction table for group collaborative bookings (Many-to-Many)
CREATE TABLE IF NOT EXISTS group_booking_members (
    booking_id BIGINT NOT NULL,
    user_id    BIGINT NOT NULL,
    PRIMARY KEY (booking_id, user_id),
    CONSTRAINT fk_gbm_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_gbm_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

-- Junction table linking kits with bundled resources
CREATE TABLE IF NOT EXISTS kit_items (
    kit_id      BIGINT NOT NULL,
    resource_id BIGINT NOT NULL,
    PRIMARY KEY (kit_id, resource_id),
    CONSTRAINT fk_kit_items_kit      FOREIGN KEY (kit_id)      REFERENCES kits(id)      ON DELETE CASCADE,
    CONSTRAINT fk_kit_items_resource FOREIGN KEY (resource_id) REFERENCES resources(id)
);

CREATE INDEX idx_bookings_kit_booking ON bookings(kit_booking_id);
CREATE INDEX idx_kit_bookings_user ON kit_bookings(user_id);
