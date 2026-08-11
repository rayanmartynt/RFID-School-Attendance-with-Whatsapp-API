# Database Schema Documentation

## Overview

The Smart School Attendance Management System uses PostgreSQL as its database. The schema is designed to handle students, staff, attendance records, RFID cards, devices, and notifications with proper relationships and constraints.

## Entity Relationship Diagram

```
┌─────────────┐
│ academic_years│
└──────┬──────┘
       │
       │
┌──────▼──────┐
│   classes   │
└──────┬──────┘
       │
       │
┌──────▼──────┐         ┌──────────┐
│  students  │◄────────│ parents  │
└──────┬──────┘         └──────────┘
       │
       │
┌──────▼──────┐         ┌──────────┐
│ attendance  │         │rfid_cards│
└─────────────┘         └────┬─────┘
                              │
                              │
┌─────────────┐         ┌────▼─────┐
│   staff     │◄────────│rfid_cards│
└──────┬──────┘         └──────────┘
       │
       │
┌──────▼──────────┐
│staff_attendance │
└─────────────────┘

┌──────────┐
│ devices  │
└────┬─────┘
     │
     │
┌────▼─────────────────┐
│ attendance          │
│ staff_attendance    │
└─────────────────────┘
```

## Tables

### academic_years

Stores academic year information for organizing classes and attendance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Academic year name (e.g., "2024-2025") |
| start_date | DATE | NOT NULL | Start date of academic year |
| end_date | DATE | NOT NULL | End date of academic year |
| is_current | BOOLEAN | DEFAULT FALSE | Whether this is the current academic year |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### classes

Stores class information with capacity and academic year association.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| grade | VARCHAR(20) | NOT NULL | Grade level (e.g., "Grade 10") |
| section | VARCHAR(20) | NOT NULL | Class section (e.g., "A") |
| academic_year_id | INTEGER | FOREIGN KEY → academic_years.id | Associated academic year |
| capacity | INTEGER | DEFAULT 40 | Maximum students in class |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Unique Constraint:** (grade, section, academic_year_id)

### users

Stores administrator user accounts for system access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| username | VARCHAR(50) | NOT NULL, UNIQUE | Login username |
| email | VARCHAR(100) | NOT NULL, UNIQUE | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| first_name | VARCHAR(100) | NOT NULL | User first name |
| last_name | VARCHAR(100) | NOT NULL | User last name |
| role | VARCHAR(20) | DEFAULT 'ADMIN' | User role (ADMIN, STAFF, etc.) |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| last_login | TIMESTAMP | NULL | Last successful login timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### parents

Stores parent/guardian information for students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| first_name | VARCHAR(100) | NOT NULL | Parent first name |
| last_name | VARCHAR(100) | NOT NULL | Parent last name |
| phone | VARCHAR(20) | NOT NULL | Contact phone number |
| whatsapp_number | VARCHAR(20) | NULL | WhatsApp number (defaults to phone) |
| email | VARCHAR(100) | NULL | Parent email address |
| address | TEXT | NULL | Physical address |
| notifications_enabled | BOOLEAN | DEFAULT TRUE | WhatsApp notifications enabled |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### students

Stores student information with class and parent associations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| student_id | VARCHAR(20) | NOT NULL, UNIQUE | Student ID (e.g., "STU00125") |
| first_name | VARCHAR(100) | NOT NULL | Student first name |
| last_name | VARCHAR(100) | NOT NULL | Student last name |
| gender | VARCHAR(10) | NOT NULL, CHECK | Gender (Male, Female, Other) |
| date_of_birth | DATE | NOT NULL | Date of birth |
| class_id | INTEGER | FOREIGN KEY → classes.id | Assigned class |
| parent_id | INTEGER | FOREIGN KEY → parents.id | Associated parent/guardian |
| rfid_uid | VARCHAR(20) | NULL | Assigned RFID card UID |
| address | TEXT | NULL | Home address |
| status | VARCHAR(20) | DEFAULT 'ACTIVE', CHECK | Student status |
| registration_date | DATE | DEFAULT CURRENT_DATE | Registration date |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Status Values:** ACTIVE, INACTIVE, GRADUATED, TRANSFERRED

### staff

Stores staff/employee information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| staff_id | VARCHAR(20) | NOT NULL, UNIQUE | Staff ID (e.g., "STAFF001") |
| first_name | VARCHAR(100) | NOT NULL | Staff first name |
| last_name | VARCHAR(100) | NOT NULL | Staff last name |
| gender | VARCHAR(10) | NOT NULL, CHECK | Gender (Male, Female, Other) |
| date_of_birth | DATE | NOT NULL | Date of birth |
| position | VARCHAR(100) | NOT NULL | Job position |
| department | VARCHAR(100) | NOT NULL | Department name |
| phone_number | VARCHAR(20) | NOT NULL | Contact phone number |
| email | VARCHAR(100) | NOT NULL | Staff email address |
| rfid_uid | VARCHAR(20) | NULL | Assigned RFID card UID |
| employment_type | VARCHAR(20) | DEFAULT 'FULL_TIME', CHECK | Employment type |
| date_joined | DATE | NOT NULL | Hire date |
| status | VARCHAR(20) | DEFAULT 'ACTIVE', CHECK | Staff status |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Employment Type Values:** FULL_TIME, PART_TIME, CONTRACT
**Status Values:** ACTIVE, INACTIVE, RESIGNED, TERMINATED

### rfid_cards

Stores RFID card registrations and assignments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| rfid_uid | VARCHAR(20) | NOT NULL, UNIQUE | RFID card UID |
| person_type | VARCHAR(20) | NOT NULL, CHECK | Person type (STUDENT or STAFF) |
| person_id | INTEGER | NOT NULL | ID of associated person |
| status | VARCHAR(20) | DEFAULT 'ACTIVE', CHECK | Card status |
| device_id | VARCHAR(50) | NULL | Associated device ID |
| issued_date | DATE | DEFAULT CURRENT_DATE | Card issue date |
| last_used | TIMESTAMP | NULL | Last successful scan timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Person Type Values:** STUDENT, STAFF
**Status Values:** ACTIVE, DISABLED, LOST, REPLACED

### devices

Stores RFID reader device information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| device_id | VARCHAR(50) | NOT NULL, UNIQUE | Device identifier |
| device_name | VARCHAR(100) | NOT NULL | Device name |
| location | VARCHAR(100) | NOT NULL | Physical location |
| device_type | VARCHAR(20) | NOT NULL, CHECK | Device type |
| status | VARCHAR(20) | DEFAULT 'ONLINE', CHECK | Device status |
| api_key | VARCHAR(255) | NOT NULL | API authentication key |
| last_seen | TIMESTAMP | NULL | Last communication timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Device Type Values:** ENTRANCE_READER, EXIT_READER
**Status Values:** ONLINE, OFFLINE, MAINTENANCE, DISABLED

### attendance

Stores **student** attendance records (separate from staff).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| student_id | INTEGER | NOT NULL, FOREIGN KEY → students.id | Student ID |
| device_id | VARCHAR(50) | FOREIGN KEY → devices.device_id | Device used for scan |
| date | DATE | NOT NULL, DEFAULT CURRENT_DATE | Attendance date |
| arrival_time | TIME | NULL | Arrival time |
| departure_time | TIME | NULL | Departure time |
| status | VARCHAR(20) | NOT NULL, CHECK | Attendance status |
| is_late | BOOLEAN | DEFAULT FALSE | Late arrival flag |
| notes | TEXT | NULL | Additional notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Status Values:** PRESENT, ABSENT, LATE, NOT_YET_ARRIVED, DEPARTED
**Unique Constraint:** (student_id, date)

### staff_attendance

Stores **staff** attendance records (separate from student attendance).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| staff_id | INTEGER | NOT NULL, FOREIGN KEY → staff.id | Staff ID |
| device_id | VARCHAR(50) | FOREIGN KEY → devices.device_id | Device used for scan |
| date | DATE | NOT NULL, DEFAULT CURRENT_DATE | Attendance date |
| arrival_time | TIME | NULL | Arrival time |
| departure_time | TIME | NULL | Departure time |
| status | VARCHAR(20) | NOT NULL, CHECK | Attendance status |
| notes | TEXT | NULL | Additional notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Status Values:** PRESENT, ABSENT, DEPARTED
**Unique Constraint:** (staff_id, date)

**Important:** Staff attendance is stored in a separate table to prevent accidental WhatsApp notifications to parents.

### notifications

Stores notification settings for students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| student_id | INTEGER | FOREIGN KEY → students.id | Student ID |
| parent_id | INTEGER | FOREIGN KEY → parents.id | Parent ID |
| notification_type | VARCHAR(20) | NOT NULL, CHECK | Notification type |
| enabled | BOOLEAN | DEFAULT TRUE | Notification enabled flag |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Notification Type Values:** ARRIVAL, DEPARTURE, ABSENCE
**Unique Constraint:** (student_id, parent_id, notification_type)

### notification_logs

Stores history of sent WhatsApp notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| student_id | INTEGER | FOREIGN KEY → students.id | Student ID |
| parent_id | INTEGER | FOREIGN KEY → parents.id | Parent ID |
| notification_type | VARCHAR(20) | NOT NULL | Notification type |
| message | TEXT | NOT NULL | Message content |
| phone_number | VARCHAR(20) | NOT NULL | Recipient phone number |
| status | VARCHAR(20) | NOT NULL, CHECK | Delivery status |
| whatsapp_message_id | VARCHAR(100) | NULL | WhatsApp message ID |
| sent_at | TIMESTAMP | DEFAULT NOW() | Send timestamp |
| error_message | TEXT | NULL | Error details if failed |

**Status Values:** SENT, FAILED, PENDING

## Indexes

### Performance Indexes

```sql
-- Students
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_students_rfid_uid ON students.rfid_uid);
CREATE INDEX idx_students_status ON students(status);

-- Staff
CREATE INDEX idx_staff_rfid_uid ON staff(rfid_uid);
CREATE INDEX idx_staff_status ON staff(status);

-- RFID Cards
CREATE INDEX idx_rfid_cards_person ON rfid_cards(person_type, person_id);
CREATE INDEX idx_rfid_cards_uid ON rfid_cards(rfid_uid);

-- Attendance
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);

-- Staff Attendance
CREATE INDEX idx_staff_attendance_staff_date ON staff_attendance(staff_id, date);
CREATE INDEX idx_staff_attendance_date ON staff_attendance(date);

-- Notification Logs
CREATE INDEX idx_notification_logs_student ON notification_logs(student_id);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Devices
CREATE INDEX idx_devices_status ON devices(status);
```

## Triggers

### Auto-update Timestamp Trigger

Automatically updates `updated_at` timestamp on row modification.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (applied to all relevant tables)
```

## Key Business Rules

### Student vs Staff Separation

1. **Student Attendance**: Stored in `attendance` table
2. **Staff Attendance**: Stored in `staff_attendance` table
3. **WhatsApp Notifications**: Only sent for student attendance
4. **No Staff Notifications**: Staff attendance never triggers WhatsApp messages

### RFID Card Assignment

1. Each RFID card is assigned to exactly one person (student or staff)
2. Person type is stored in `rfid_cards.person_type`
3. Same RFID UID cannot be assigned to multiple people
4. Cards can be disabled, lost, or replaced

### Attendance Rules

1. **First Scan**: Records arrival time
2. **Second Scan**: Records departure time
3. **Duplicate Prevention**: Cooldown period prevents multiple scans
4. **Late Detection**: Based on configurable threshold
5. **Device Tracking**: Each scan records the device used

### Notification Rules

1. **Student Arrival**: Sends WhatsApp notification to parent
2. **Student Departure**: Sends WhatsApp notification to parent
3. **Staff Attendance**: NO WhatsApp notification sent
4. **Notification Settings**: Can be enabled/disabled per student

## Data Integrity

### Foreign Key Constraints

All foreign key relationships are enforced to maintain data integrity:
- Students must have valid class and parent
- Staff must have valid department
- Attendance records must reference valid students/staff
- RFID cards must reference valid persons
- Devices must have unique IDs

### Unique Constraints

Prevent duplicate data:
- Student IDs must be unique
- Staff IDs must be unique
- RFID UIDs must be unique
- Device IDs must be unique
- One attendance record per student per day
- One staff attendance record per staff per day

### Check Constraints

Validate data values:
- Gender must be Male, Female, or Other
- Status values must be from allowed set
- Person type must be STUDENT or STAFF
- Device type must be ENTRANCE_READER or EXIT_READER

## Migration Strategy

### Adding New Fields

```sql
-- Example: Adding a new field to students
ALTER TABLE students ADD COLUMN middle_name VARCHAR(100);
```

### Modifying Field Types

```sql
-- Example: Increasing field size
ALTER TABLE students ALTER COLUMN student_id TYPE VARCHAR(30);
```

### Adding New Tables

```sql
-- Example: Adding a new table
CREATE TABLE new_table (
    id SERIAL PRIMARY KEY,
    field_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Backup Before Migration

```bash
pg_dump -U postgres -d school_attendance > backup_before_migration.sql
```

## Performance Considerations

### Query Optimization

1. Use indexed columns in WHERE clauses
2. Avoid SELECT * in production queries
3. Use JOINs efficiently with proper indexes
4. Consider partitioning large tables by date

### Database Maintenance

```sql
-- Analyze tables for query optimization
ANALYZE students;
ANALYZE attendance;
ANALYZE staff_attendance;

-- Vacuum to reclaim space
VACUUM FULL attendance;

-- Reindex if needed
REINDEX TABLE attendance;
```

### Archive Strategy

For long-running systems, consider archiving old attendance records:

```sql
-- Create archive table
CREATE TABLE attendance_archive (LIKE attendance INCLUDING ALL);

-- Move old records
INSERT INTO attendance_archive SELECT * FROM attendance WHERE date < '2023-01-01';
DELETE FROM attendance WHERE date < '2023-01-01';
```
