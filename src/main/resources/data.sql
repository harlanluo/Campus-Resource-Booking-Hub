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

-- Resources  (21 records; retain the original first nine identities and order)
INSERT INTO resources (name, type, description, location, capacity, status, manual_maintenance) VALUES
    ('Study Room A',                 'ROOM',      'Quiet study room with table power and a whiteboard.',                                              'Library, Level 2, A',                         6,    'AVAILABLE',   FALSE),
    ('Computer Lab 101',             'LAB',       'General-purpose PC lab with course software and high-speed network access.',                       'Computing Building, Level 1, 101',            30,   'AVAILABLE',   FALSE),
    ('Projector Unit #3',            'EQUIPMENT', 'Portable projector with HDMI, carry case, and remote.',                                            'AV Loan Desk, Library Ground Floor',          NULL, 'MAINTENANCE', TRUE),
    ('DSLR 4K Camera',               'EQUIPMENT', '4K camera with standard zoom lens, battery, charger, and carry bag.',                              'Media Equipment Desk',                        NULL, 'AVAILABLE',   FALSE),
    ('Heavy-Duty Tripod',            'EQUIPMENT', 'Stable fluid-head tripod with quick-release plate.',                                               'Media Equipment Desk',                        NULL, 'AVAILABLE',   FALSE),
    ('Shotgun Mic Kit',              'EQUIPMENT', 'Directional microphone with XLR cable and windscreen.',                                             'Media Equipment Desk',                        NULL, 'AVAILABLE',   FALSE),
    ('Studio Podcast Mic',           'EQUIPMENT', 'Broadcast dynamic microphone for voice recording.',                                                 'Podcast Studio Equipment Desk',               NULL, 'AVAILABLE',   FALSE),
    ('Audio Interface Mixer',        'EQUIPMENT', 'Two-channel USB audio interface with phantom power and direct monitoring.',                         'Podcast Studio Equipment Desk',               NULL, 'AVAILABLE',   FALSE),
    ('Studio Monitor Headphones',    'EQUIPMENT', 'Closed-back headphones for recording and audio monitoring.',                                        'Podcast Studio Equipment Desk',               NULL, 'AVAILABLE',   FALSE),
    ('Group Study Room B',           'ROOM',      'Enclosed group room with display, whiteboard, and table power.',                                     'Library, Level 2, B',                         8,    'AVAILABLE',   FALSE),
    ('Quiet Study Room 2.14',        'ROOM',      'Low-noise focus room with acoustic door and individual work points.',                              'Library, Level 2, 2.14',                      4,    'AVAILABLE',   FALSE),
    ('Accessible Study Room 1.05',   'ROOM',      'Step-free study room with clear turning space and a height-adjustable table.',                      'Student Centre, Ground, 1.05',                4,    'AVAILABLE',   FALSE),
    ('Project Team Room 3.12',       'ROOM',      'Team workspace with wall display and writable collaboration boards.',                              'Learning Hub, Level 3, 3.12',                 10,   'AVAILABLE',   FALSE),
    ('Postgraduate Study Room 2.21', 'ROOM',      'Quiet shared study room for postgraduate work and small meetings.',                                 'Library, Level 2, 2.21',                      6,    'AVAILABLE',   FALSE),
    ('Computer Lab 203',             'LAB',       'Desktop lab with dual monitors and general teaching software.',                                     'Computing Building, Level 2, 203',            24,   'AVAILABLE',   FALSE),
    ('GPU Computing Lab',            'LAB',       'GPU workstations for machine-learning, simulation, and rendering coursework.',                      'Computing Building, Level 2, 2.16',           20,   'AVAILABLE',   FALSE),
    ('Electronics Prototyping Lab',  'LAB',       'Supervised bench space for electronics measurement and prototyping work.',                          'Engineering Building, E1.14',                 16,   'AVAILABLE',   FALSE),
    ('Wireless Presentation Kit',   'EQUIPMENT', 'Presentation clicker plus USB-C and HDMI adapters in a labelled case.',                             'AV Loan Desk, Library Ground Floor',          NULL, 'AVAILABLE',   FALSE),
    ('Portable LCD Projector',       'EQUIPMENT', 'Portable teaching projector with HDMI and USB-C adapters and carry case.',                          'AV Loan Desk, Library Ground Floor',          NULL, 'AVAILABLE',   FALSE),
    ('Portable Field Recorder',      'EQUIPMENT', 'Multitrack portable recorder with lavalier microphone set and storage case.',                       'Media Equipment Desk',                        NULL, 'AVAILABLE',   FALSE),
    ('LED Light Panel Kit',          'EQUIPMENT', 'Pair of portable bi-colour LED light panels with stands and power accessories.',                    'Media Equipment Desk',                        NULL, 'AVAILABLE',   FALSE);

-- Project Kits and their current resource composition
INSERT INTO kits (name, description) VALUES
    ('Media Production Kit', 'Compact setup for student video projects.'),
    ('Podcast Recording Kit', 'Small audio setup for podcasts and recorded interviews.'),
    ('Hybrid Teaching Kit', 'Portable presentation setup for teaching sessions and student showcases.'),
    ('Field Interview Kit', 'Portable setup for filming and recording student interviews.');

INSERT INTO kit_items (kit_id, resource_id) VALUES
    (1, 4),
    (1, 5),
    (1, 6),
    (2, 7),
    (2, 8),
    (2, 9),
    (3, 19),
    (3, 18),
    (4, 4),
    (4, 5),
    (4, 20),
    (4, 21);

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
