-- Smart School Attendance Management Database Schema
-- PostgreSQL Database

-- Drop existing tables (for clean setup)
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS staff_attendance CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS rfid_cards CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Academic Years Table
CREATE TABLE academic_years (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes Table
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    grade VARCHAR(20) NOT NULL,
    section VARCHAR(20) NOT NULL,
    academic_year_id INTEGER REFERENCES academic_years(id),
    capacity INTEGER DEFAULT 40,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(grade, section, academic_year_id)
);

-- Users Table (Administrators)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'ADMIN',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parents/Guardians Table
CREATE TABLE parents (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    whatsapp_number VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE NOT NULL,
    class_id INTEGER REFERENCES classes(id),
    parent_id INTEGER REFERENCES parents(id),
    rfid_uid VARCHAR(20),
    address TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED')),
    registration_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff Table
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    staff_id VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE NOT NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    rfid_uid VARCHAR(20),
    employment_type VARCHAR(20) DEFAULT 'FULL_TIME' CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT')),
    date_joined DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'RESIGNED', 'TERMINATED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RFID Cards Table
CREATE TABLE rfid_cards (
    id SERIAL PRIMARY KEY,
    rfid_uid VARCHAR(20) NOT NULL UNIQUE,
    person_type VARCHAR(20) NOT NULL CHECK (person_type IN ('STUDENT', 'STAFF')),
    person_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED', 'LOST', 'REPLACED')),
    device_id VARCHAR(50),
    issued_date DATE DEFAULT CURRENT_DATE,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices Table (Arduino RFID Readers)
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL UNIQUE,
    device_name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('ENTRANCE_READER', 'EXIT_READER')),
    status VARCHAR(20) DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE', 'DISABLED')),
    api_key VARCHAR(255) NOT NULL,
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Attendance Table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    device_id VARCHAR(50) REFERENCES devices(device_id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    arrival_time TIME,
    departure_time TIME,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'NOT_YET_ARRIVED', 'DEPARTED')),
    is_late BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date)
);

-- Staff Attendance Table (Separate from student attendance)
CREATE TABLE staff_attendance (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id),
    device_id VARCHAR(50) REFERENCES devices(device_id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    arrival_time TIME,
    departure_time TIME,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'DEPARTED')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, date)
);

-- Notifications Table (WhatsApp notification settings)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    parent_id INTEGER REFERENCES parents(id),
    notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('ARRIVAL', 'DEPARTURE', 'ABSENCE')),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, parent_id, notification_type)
);

-- Notification Logs Table (Track sent notifications)
CREATE TABLE notification_logs (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    parent_id INTEGER REFERENCES parents(id),
    notification_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SENT', 'FAILED', 'PENDING')),
    whatsapp_message_id VARCHAR(100),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);

-- Create Indexes for Performance
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_students_rfid_uid ON students(rfid_uid);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_staff_rfid_uid ON staff(rfid_uid);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_rfid_cards_person ON rfid_cards(person_type, person_id);
CREATE INDEX idx_rfid_cards_uid ON rfid_cards(rfid_uid);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_staff_attendance_staff_date ON staff_attendance(staff_id, date);
CREATE INDEX idx_staff_attendance_date ON staff_attendance(date);
CREATE INDEX idx_notification_logs_student ON notification_logs(student_id);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX idx_devices_status ON devices(status);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfid_cards_updated_at BEFORE UPDATE ON rfid_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_attendance_updated_at BEFORE UPDATE ON staff_attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
