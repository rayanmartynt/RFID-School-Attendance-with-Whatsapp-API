-- Sample Seed Data for Testing
-- This file contains sample data for development and testing

-- Insert Sample Parents
INSERT INTO parents (first_name, last_name, phone, whatsapp_number, email, address, notifications_enabled) VALUES
('Mary', 'Kamara', '+23278123456', '+23278123456', 'mary.kamara@email.com', '123 Freetown Road, Freetown', TRUE),
('James', 'Conteh', '+23278234567', '+23278234567', 'james.conteh@email.com', '456 Bo Street, Freetown', TRUE),
('Fatmata', 'Turay', '+23278345678', '+23278345678', 'fatmata.turay@email.com', '789 Wilkinson Road, Freetown', TRUE),
('Ibrahim', 'Sesay', '+23278456789', '+23278456789', 'ibrahim.sesay@email.com', '321 Pademba Road, Freetown', TRUE),
('Aminata', 'Koroma', '+23278567890', '+23278567890', 'aminata.koroma@email.com', '654 Siaka Stevens Street, Freetown', TRUE);

-- Insert Sample Students
INSERT INTO students (student_id, first_name, last_name, gender, date_of_birth, class_id, parent_id, rfid_uid, address, status) VALUES
('STU00125', 'John', 'Kamara', 'Male', '2008-05-15', 1, 1, 'A37B9122', '123 Freetown Road, Freetown', 'ACTIVE'),
('STU00126', 'Sarah', 'Conteh', 'Female', '2008-08-22', 2, 2, 'B4921137', '456 Bo Street, Freetown', 'ACTIVE'),
('STU00127', 'Michael', 'Turay', 'Male', '2007-12-10', 3, 3, 'C5A3B448', '789 Wilkinson Road, Freetown', 'ACTIVE'),
('STU00128', 'Elizabeth', 'Sesay', 'Female', '2008-03-18', 4, 4, 'D6C5D559', '321 Pademba Road, Freetown', 'ACTIVE'),
('STU00129', 'David', 'Koroma', 'Male', '2007-07-25', 5, 5, 'E7D6E66A', '654 Siaka Stevens Street, Freetown', 'ACTIVE'),
('STU00130', 'Grace', 'Bangura', 'Female', '2008-01-30', 1, 1, 'F8E7F77B', '123 Freetown Road, Freetown', 'ACTIVE'),
('STU00131', 'Samuel', 'Kamara', 'Male', '2007-11-12', 2, 2, '19F8G88C', '456 Bo Street, Freetown', 'ACTIVE'),
('STU00132', 'Rebecca', 'Conteh', 'Female', '2008-04-05', 3, 3, '2A0G999D', '789 Wilkinson Road, Freetown', 'ACTIVE');

-- Insert Sample Staff
INSERT INTO staff (staff_id, first_name, last_name, gender, date_of_birth, position, department, phone_number, email, rfid_uid, employment_type, date_joined, status) VALUES
('STAFF001', 'Abdul Karim', 'Koroma', 'Male', '1980-03-15', 'Lecturer', 'Information Technology', '+23277123456', 'abdul.koroma@school.edu', 'B4921137', 'FULL_TIME', '2015-09-01', 'ACTIVE'),
('STAFF002', 'Fatmata', 'Bangura', 'Female', '1985-07-22', 'Teacher', 'Mathematics', '+23277234567', 'fatmata.bangura@school.edu', 'C5A3B448', 'FULL_TIME', '2018-09-01', 'ACTIVE'),
('STAFF003', 'Ibrahim', 'Sesay', 'Male', '1982-11-10', 'Principal', 'Administration', '+23277345678', 'ibrahim.sesay@school.edu', 'D6C5D559', 'FULL_TIME', '2010-09-01', 'ACTIVE'),
('STAFF004', 'Aminata', 'Turay', 'Female', '1988-02-18', 'Secretary', 'Administration', '+23277456789', 'aminata.turay@school.edu', 'E7D6E66A', 'FULL_TIME', '2019-09-01', 'ACTIVE'),
('STAFF005', 'James', 'Conteh', 'Male', '1984-06-25', 'Security Guard', 'Security', '+23277567890', 'james.conteh@school.edu', 'F8E7F77B', 'FULL_TIME', '2020-09-01', 'ACTIVE');

-- Insert RFID Cards
INSERT INTO rfid_cards (rfid_uid, person_type, person_id, status, device_id, issued_date) VALUES
('A37B9122', 'STUDENT', 1, 'ACTIVE', 'GATE-001', '2024-09-01'),
('B4921137', 'STAFF', 1, 'ACTIVE', 'GATE-001', '2024-09-01'),
('C5A3B448', 'STUDENT', 3, 'ACTIVE', 'GATE-001', '2024-09-01'),
('D6C5D559', 'STAFF', 3, 'ACTIVE', 'GATE-001', '2024-09-01'),
('E7D6E66A', 'STUDENT', 5, 'ACTIVE', 'GATE-001', '2024-09-01'),
('F8E7F77B', 'STAFF', 5, 'ACTIVE', 'GATE-001', '2024-09-01'),
('19F8G88C', 'STUDENT', 7, 'ACTIVE', 'GATE-001', '2024-09-01'),
('2A0G999D', 'STUDENT', 8, 'ACTIVE', 'GATE-001', '2024-09-01');

-- Insert Sample Student Attendance (Today)
INSERT INTO attendance (student_id, device_id, date, arrival_time, departure_time, status, is_late) VALUES
(1, 'GATE-001', CURRENT_DATE, '07:42:00', '16:18:00', 'PRESENT', FALSE),
(2, 'GATE-001', CURRENT_DATE, '07:44:00', '16:20:00', 'PRESENT', FALSE),
(3, 'GATE-001', CURRENT_DATE, '08:15:00', NULL, 'LATE', TRUE),
(5, 'GATE-001', CURRENT_DATE, '07:50:00', NULL, 'PRESENT', FALSE),
(7, 'GATE-001', CURRENT_DATE, '07:38:00', NULL, 'PRESENT', FALSE);

-- Insert Sample Staff Attendance (Today)
INSERT INTO staff_attendance (staff_id, device_id, date, arrival_time, departure_time, status) VALUES
(1, 'GATE-001', CURRENT_DATE, '07:31:00', '16:30:00', 'PRESENT'),
(2, 'GATE-001', CURRENT_DATE, '07:45:00', NULL, 'PRESENT'),
(3, 'GATE-001', CURRENT_DATE, '07:20:00', '17:00:00', 'PRESENT'),
(5, 'GATE-001', CURRENT_DATE, '08:00:00', NULL, 'PRESENT');

-- Insert Notification Settings
INSERT INTO notifications (student_id, parent_id, notification_type, enabled) VALUES
(1, 1, 'ARRIVAL', TRUE),
(1, 1, 'DEPARTURE', TRUE),
(1, 1, 'ABSENCE', TRUE),
(2, 2, 'ARRIVAL', TRUE),
(2, 2, 'DEPARTURE', TRUE),
(2, 2, 'ABSENCE', TRUE);
