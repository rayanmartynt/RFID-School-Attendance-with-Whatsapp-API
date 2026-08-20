import { pgTable, serial, varchar, text, integer, timestamp, boolean, date, time, decimal } from 'drizzle-orm/pg-core';

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  email: varchar('email', { length: 100 }),
  role: varchar('role', { length: 20 }).notNull().default('ADMIN'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Academic Years Table
export const academicYears = pgTable('academic_years', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Classes Table
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  grade: varchar('grade', { length: 20 }).notNull(),
  section: varchar('section', { length: 10 }).notNull(),
  academicYearId: integer('academic_year_id').references(() => academicYears.id),
  capacity: integer('capacity').notNull().default(40),
  roomNumber: varchar('room_number', { length: 20 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Parents Table
export const parents = pgTable('parents', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 100 }),
  address: text('address'),
  notificationEnabled: boolean('notification_enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Students Table
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  studentId: varchar('student_id', { length: 20 }).notNull().unique(),
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 10 }),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  classId: integer('class_id').references(() => classes.id),
  parentId: integer('parent_id').references(() => parents.id),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Staff Table
export const staff = pgTable('staff', {
  id: serial('id').primaryKey(),
  staffId: varchar('staff_id', { length: 20 }).notNull().unique(),
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  position: varchar('position', { length: 50 }).notNull(),
  department: varchar('department', { length: 50 }).notNull(),
  email: varchar('email', { length: 100 }),
  phone: varchar('phone', { length: 20 }).notNull(),
  address: text('address'),
  dateJoined: date('date_joined').notNull(),
  employmentType: varchar('employment_type', { length: 20 }).notNull().default('FULL_TIME'),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// RFID Cards Table
export const rfidCards = pgTable('rfid_cards', {
  id: serial('id').primaryKey(),
  rfidUid: varchar('rfid_uid', { length: 20 }).notNull().unique(),
  personType: varchar('person_type', { length: 20 }).notNull(),
  personId: integer('person_id').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  deviceId: varchar('device_id', { length: 50 }),
  issuedDate: date('issued_date').notNull().defaultNow(),
  lastUsed: timestamp('last_used'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Devices Table
export const devices = pgTable('devices', {
  id: serial('id').primaryKey(),
  deviceId: varchar('device_id', { length: 50 }).notNull().unique(),
  deviceName: varchar('device_name', { length: 100 }).notNull(),
  location: varchar('location', { length: 100 }).notNull(),
  deviceType: varchar('device_type', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('ONLINE'),
  apiKey: varchar('api_key', { length: 255 }).notNull(),
  lastSeen: timestamp('last_seen'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Student Attendance Table
export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull().references(() => students.id),
  deviceId: varchar('device_id', { length: 50 }).references(() => devices.deviceId),
  date: date('date').notNull().defaultNow(),
  arrivalTime: time('arrival_time'),
  departureTime: time('departure_time'),
  status: varchar('status', { length: 20 }).notNull(),
  isLate: boolean('is_late').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Staff Attendance Table
export const staffAttendance = pgTable('staff_attendance', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').notNull().references(() => staff.id),
  deviceId: varchar('device_id', { length: 50 }).references(() => devices.deviceId),
  date: date('date').notNull().defaultNow(),
  arrivalTime: time('arrival_time'),
  departureTime: time('departure_time'),
  status: varchar('status', { length: 20 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Notifications Table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id),
  parentId: integer('parent_id').references(() => parents.id),
  notificationType: varchar('notification_type', { length: 20 }).notNull(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Notification History Table
export const notificationHistory = pgTable('notification_history', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id),
  parentId: integer('parent_id').references(() => parents.id),
  type: varchar('type', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  message: text('message'),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  error: text('error')
});
