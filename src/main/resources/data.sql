-- =============================================================
-- Campus Booking Hub - Seed / Mock Data
-- Passwords below are BCrypt hashes of 'password123'
-- Use this hash in production
-- =============================================================

-- Users  (2 records)
INSERT INTO users (username, password, email, role) VALUES
    ('alice_student', '$2a$10$7QJ8zXmK3nL9pRvWuYtHOe1kG5sDF0qNbCaIwMjEhZlVdPXoTgSyA', 'alice@campus.edu',  'STUDENT'),
    ('bob_admin',     '$2a$10$7QJ8zXmK3nL9pRvWuYtHOe1kG5sDF0qNbCaIwMjEhZlVdPXoTgSyA', 'bob@campus.edu',    'ADMIN');

-- Resources  (3 records)
INSERT INTO resources (name, type, description, status) VALUES
    ('Study Room A',       'ROOM',      'Quiet study room on Level 2, seats 6.',                       'AVAILABLE'),
    ('Computer Lab 101',   'LAB',       'PC lab with 30 workstations and high-speed internet.',        'AVAILABLE'),
    ('Projector Unit #3',  'EQUIPMENT', 'Portable HDMI projector with carry case, 4K capable.',       'MAINTENANCE');

-- Bookings  (2 records)
INSERT INTO bookings (user_id, resource_id, start_time, end_time, status) VALUES
    -- Alice books Study Room A for a 2-hour session
    (1, 1, '2026-08-01 09:00:00', '2026-08-01 11:00:00', 'CONFIRMED'),
    -- Alice books Computer Lab 101 for an afternoon session
    (1, 2, '2026-08-02 13:00:00', '2026-08-02 16:00:00', 'PENDING');

-- Waitlist  (1 record)
INSERT INTO waitlists (user_id, resource_id, request_time, status) VALUES
    -- Bob is waiting for Study Room A (already booked by Alice)
    (2, 1, '2026-07-25 10:30:00', 'WAITING');

-- Group Booking Members  (1 record)
-- Bob is added as a group member to Alice's Study Room A booking (booking_id = 1)
INSERT INTO group_booking_members (booking_id, user_id) VALUES
    (1, 2);
