-- =============================================================
-- Campus Booking Hub - Seed / Mock Data
-- Passwords below are BCrypt hashes of 'password123'
-- Use this hash in production
-- =============================================================

-- Users  (2 records)
INSERT INTO users (username, password, email, role) VALUES
    ('alice_student', '$2a$10$7QJ8zXmK3nL9pRvWuYtHOe1kG5sDF0qNbCaIwMjEhZlVdPXoTgSyA', 'alice@campus.edu',  'STUDENT'),
    ('bob_admin',     '$2a$10$7QJ8zXmK3nL9pRvWuYtHOe1kG5sDF0qNbCaIwMjEhZlVdPXoTgSyA', 'bob@campus.edu',    'ADMIN');

-- Resources  (9 records)
INSERT INTO resources (name, type, description, status, manual_maintenance) VALUES
    ('Study Room A',              'ROOM',      'Quiet study room on Level 2, seats 6.',                                          'AVAILABLE',   FALSE),
    ('Computer Lab 101',          'LAB',       'PC lab with 30 workstations and high-speed internet.',                           'AVAILABLE',   FALSE),
    ('Projector Unit #3',         'EQUIPMENT', 'Portable HDMI projector with carry case, 4K capable.',                          'MAINTENANCE', TRUE),
    ('DSLR 4K Camera',            'EQUIPMENT', 'Sony Alpha 4K Cinema Camera with 24-70mm f/2.8 zoom lens.',                      'AVAILABLE',   FALSE),
    ('Heavy-Duty Tripod',         'EQUIPMENT', 'Fluid-head professional aluminum tripod with quick-release plate.',              'AVAILABLE',   FALSE),
    ('Shotgun Mic Kit',           'EQUIPMENT', 'Directional condenser shotgun mic with XLR cable and deadcat wind shield.',      'AVAILABLE',   FALSE),
    ('Studio Podcast Mic',        'EQUIPMENT', 'Broadcast dynamic cardioid XLR microphone for pristine studio vocals.',          'AVAILABLE',   FALSE),
    ('Audio Interface Mixer',     'EQUIPMENT', '2-channel USB audio interface with +48V phantom power and direct monitoring.',   'AVAILABLE',   FALSE),
    ('Studio Monitor Headphones', 'EQUIPMENT', 'Closed-back professional over-ear audio monitoring headphones.',                 'AVAILABLE',   FALSE);

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

-- Project Kits  (2 records)
INSERT INTO kits (name, description) VALUES
    ('Media Production Kit', 'Complete cinematography bundle: 4K DSLR Camera, Heavy-Duty Tripod, and Directional Shotgun Mic.'),
    ('Podcast Recording Kit', 'All-in-one studio bundle: Broadcast Dynamic Mic, 2-Channel USB Audio Mixer, and Studio Monitor Headphones.');

-- Kit Items mapping
INSERT INTO kit_items (kit_id, resource_id) VALUES
    -- Kit 1: Media Production Kit -> DSLR (4), Tripod (5), Shotgun Mic (6)
    (1, 4),
    (1, 5),
    (1, 6),
    -- Kit 2: Podcast Recording Kit -> Studio Mic (7), Audio Mixer (8), Headphones (9)
    (2, 7),
    (2, 8),
    (2, 9);
