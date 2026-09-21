-- =============================================================
-- Campus Booking Hub - Seed / Mock Data
-- Passwords below are BCrypt hashes of 'password123'
-- Use this hash in production
-- =============================================================

-- Main demo identities (the only profiles exposed by the frontend)
INSERT INTO users (username, password, email, role) VALUES
    ('alice_student', '$2a$10$Q3zGnMD5yWq.yoMDZ.bYK.egyMsRGC95lpC62x68FB8u9m2C1CQse', 'alice@campus.edu',  'STUDENT'),
    ('bob_admin',     '$2a$10$Q3zGnMD5yWq.yoMDZ.bYK.egyMsRGC95lpC62x68FB8u9m2C1CQse', 'bob@campus.edu',    'ADMIN');

-- Background students make the availability calendar meaningful. They are
-- deliberately not selectable in the frontend demo-profile switch.
INSERT INTO users (username, password, email, role) VALUES
    ('maya_chen',    '$2a$10$Q3zGnMD5yWq.yoMDZ.bYK.egyMsRGC95lpC62x68FB8u9m2C1CQse', 'maya.chen@campus.edu',    'STUDENT'),
    ('liam_wilson',  '$2a$10$Q3zGnMD5yWq.yoMDZ.bYK.egyMsRGC95lpC62x68FB8u9m2C1CQse', 'liam.wilson@campus.edu',  'STUDENT'),
    ('priya_patel',  '$2a$10$Q3zGnMD5yWq.yoMDZ.bYK.egyMsRGC95lpC62x68FB8u9m2C1CQse', 'priya.patel@campus.edu',  'STUDENT'),
    ('ethan_taylor', '$2a$10$Q3zGnMD5yWq.yoMDZ.bYK.egyMsRGC95lpC62x68FB8u9m2C1CQse', 'ethan.taylor@campus.edu', 'STUDENT');

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

-- Project Kits and their current resource composition
INSERT INTO kits (name, description) VALUES
    ('Media Production Kit', 'Complete cinematography bundle: 4K DSLR Camera, Heavy-Duty Tripod, and Directional Shotgun Mic.'),
    ('Podcast Recording Kit', 'All-in-one studio bundle: Broadcast Dynamic Mic, 2-Channel USB Audio Mixer, and Studio Monitor Headphones.');

INSERT INTO kit_items (kit_id, resource_id) VALUES
    (1, 4),
    (1, 5),
    (1, 6),
    (2, 7),
    (2, 8),
    (2, 9);

-- One first-class demo Kit reservation. Its child rows below block resources.
INSERT INTO kit_bookings
    (booking_reference, kit_id, user_id, start_time, end_time, status, resource_count, created_at, updated_at)
VALUES
    ('KIT-2026-000001', 2, 1, '2026-10-06 13:00:00', '2026-10-06 15:00:00',
     'PENDING', 3, '2026-09-21 09:00:00', '2026-09-21 09:00:00');

-- Original bookings retained, followed by future background reservations.
INSERT INTO bookings (user_id, resource_id, start_time, end_time, status) VALUES
    -- Alice books Study Room A for a 2-hour session
    (1, 1, '2026-08-01 09:00:00', '2026-08-01 11:00:00', 'CONFIRMED'),
    -- Alice books Computer Lab 101 for an afternoon session
    (1, 2, '2026-08-02 13:00:00', '2026-08-02 16:00:00', 'PENDING'),
    -- Week of 21 September 2026
    (3, 1, '2026-09-21 09:00:00', '2026-09-21 10:30:00', 'APPROVED'),
    (4, 1, '2026-09-22 13:00:00', '2026-09-22 15:00:00', 'PENDING'),
    (5, 2, '2026-09-21 11:00:00', '2026-09-21 12:30:00', 'CONFIRMED'),
    (6, 2, '2026-09-23 14:00:00', '2026-09-23 16:00:00', 'APPROVED'),
    (3, 4, '2026-09-22 10:00:00', '2026-09-22 12:00:00', 'APPROVED'),
    (4, 5, '2026-09-24 15:00:00', '2026-09-24 17:00:00', 'PENDING'),
    (5, 6, '2026-09-25 09:30:00', '2026-09-25 11:30:00', 'CONFIRMED'),
    (6, 7, '2026-09-23 10:30:00', '2026-09-23 12:00:00', 'APPROVED'),
    -- Following week keeps next-week navigation useful
    (3, 8, '2026-09-28 13:00:00', '2026-09-28 15:00:00', 'PENDING'),
    (4, 9, '2026-09-29 09:00:00', '2026-09-29 11:00:00', 'APPROVED'),
    (5, 4, '2026-09-30 14:30:00', '2026-09-30 16:30:00', 'CONFIRMED'),
    (6, 1, '2026-10-01 10:00:00', '2026-10-01 12:00:00', 'APPROVED');

INSERT INTO bookings
    (user_id, resource_id, kit_booking_id, start_time, end_time, status)
VALUES
    (1, 7, 1, '2026-10-06 13:00:00', '2026-10-06 15:00:00', 'PENDING'),
    (1, 8, 1, '2026-10-06 13:00:00', '2026-10-06 15:00:00', 'PENDING'),
    (1, 9, 1, '2026-10-06 13:00:00', '2026-10-06 15:00:00', 'PENDING');

INSERT INTO kit_booking_members (kit_booking_id, user_id) VALUES
    (1, 3);

-- Slot-aware waitlist sample for a currently conflicting future interval
INSERT INTO waitlists (user_id, resource_id, requested_start, requested_end, request_time, status) VALUES
    (1, 1, '2026-10-01 10:00:00', '2026-10-01 12:00:00', '2026-09-20 10:30:00', 'WAITING');

-- Group Booking Members  (1 record)
-- Bob is added as a group member to Alice's Study Room A booking (booking_id = 1)
INSERT INTO group_booking_members (booking_id, user_id) VALUES
    (1, 2);
