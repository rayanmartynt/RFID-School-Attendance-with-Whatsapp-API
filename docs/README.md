# Smart School Attendance Management System

A complete RFID-based school attendance system with WhatsApp notifications for parents, real-time dashboard updates, and separate attendance tracking for students and staff.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Arduino Setup](#arduino-setup)
- [WhatsApp Configuration](#whatsapp-configuration)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Overview

This system provides a complete solution for managing school attendance using RFID cards. Key features include:

- **Student Attendance**: RFID card scanning with automatic parent WhatsApp notifications
- **Staff Attendance**: Separate tracking without parent notifications
- **Real-time Dashboard**: Live attendance updates via Socket.IO
- **Comprehensive Reports**: Daily, weekly, and monthly attendance reports
- **Device Management**: Monitor and manage RFID reader devices
- **Offline Support**: Arduino devices queue data when offline

## Features

### For Students
- RFID card-based attendance tracking
- Automatic WhatsApp notifications to parents on arrival/departure
- Late arrival detection
- Attendance history tracking
- Class-based attendance overview

### For Staff
- RFID card-based attendance tracking
- NO WhatsApp notifications (as per requirements)
- Separate attendance database table
- Department-based tracking
- Employment type management

### For Administrators
- Real-time dashboard with live attendance updates
- Student and staff management
- Parent/guardian management
- RFID card registration and management
- Device monitoring
- Attendance reports with export options
- Notification history and statistics

## System Architecture

```
┌─────────────────┐
│   Arduino UNO   │
│   R4 WiFi +     │
│   RC522 Reader  │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│  Node.js/Express│
│  Backend API    │
│  + Socket.IO    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │
│   Database      │
└─────────────────┘
         │
         ↓
┌─────────────────┐
│  WhatsApp Cloud │
│  API (for       │
│  students only) │
└─────────────────┘

┌─────────────────┐
│  React.js       │
│  Frontend       │
│  Dashboard      │
└─────────────────┘
         │ WebSocket
         ↓
┌─────────────────┐
│  Socket.IO      │
│  Real-time      │
│  Updates       │
└─────────────────┘
```

## Prerequisites

### Software
- Node.js 18+ and npm
- PostgreSQL 14+
- Git
- Arduino IDE 2.0+

### Hardware (for Arduino devices)
- Arduino UNO R4 WiFi
- RC522 RFID Reader Module
- LCD 16x2 with I2C adapter
- Green LED, Red LED
- Buzzer
- Resistors, jumper wires, breadboard

### Services
- WhatsApp Business Cloud API account
- Domain name (for HTTPS)
- SSL certificate (for production)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "RFID wit Whatsapp Api"
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Database Setup

See [Database Setup](#database-setup) section below.

### 5. Arduino Setup

See [Arduino Setup](#arduino-setup) section below.

## Configuration

### Backend Configuration

Create `.env` file in the `backend` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=school_attendance
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# WhatsApp Business Cloud API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_API_VERSION=v18.0
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# School Information
SCHOOL_NAME=ABC School
SCHOOL_ADDRESS=123 Education Street, Freetown
SCHOOL_TIME_START=08:00
SCHOOL_TIME_END=16:00

# Attendance Rules
DUPLICATE_SCAN_COOLDOWN_MINUTES=5
LATE_THRESHOLD_MINUTES=15

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### Frontend Configuration

Create `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

## Database Setup

### 1. Create PostgreSQL Database

```bash
createdb school_attendance
```

### 2. Run Schema Migration

```bash
cd backend
psql -U postgres -d school_attendance -f ../database/schema.sql
```

### 3. Load Seed Data (Optional)

```bash
psql -U postgres -d school_attendance -f ../database/seed_data.sql
```

### 4. Verify Tables

```bash
psql -U postgres -d school_attendance
\dt
```

Expected tables:
- users
- students
- parents
- staff
- classes
- rfid_cards
- attendance
- staff_attendance
- devices
- notifications
- notification_logs
- academic_years

## Running the Application

### Development Mode

#### Start Backend

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:5000`

#### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

### Production Mode

#### Start Backend

```bash
cd backend
npm start
```

#### Build and Start Frontend

```bash
cd frontend
npm run build
npm run preview
```

## API Documentation

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Authentication
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/verify` - Verify token

#### Students
- `GET /api/v1/students` - Get all students
- `GET /api/v1/students/:id` - Get student by ID
- `POST /api/v1/students` - Create new student
- `PUT /api/v1/students/:id` - Update student
- `DELETE /api/v1/students/:id` - Delete student

#### Staff
- `GET /api/v1/staff` - Get all staff
- `GET /api/v1/staff/:id` - Get staff by ID
- `POST /api/v1/staff` - Create new staff
- `PUT /api/v1/staff/:id` - Update staff
- `DELETE /api/v1/staff/:id` - Delete staff

#### Attendance
- `POST /api/v1/attendance/tap` - RFID card tap (no auth - for Arduino)
- `GET /api/v1/attendance` - Get student attendance
- `GET /api/v1/attendance/absent/:date` - Get absent students

#### Staff Attendance
- `POST /api/v1/staff-attendance/tap` - Staff RFID tap (no auth - for Arduino)
- `GET /api/v1/staff-attendance` - Get staff attendance

#### RFID Cards
- `GET /api/v1/rfid` - Get all RFID cards
- `GET /api/v1/rfid/:uid` - Get RFID card by UID
- `POST /api/v1/rfid/register` - Register new RFID card
- `PUT /api/v1/rfid/:uid/status` - Update card status
- `PUT /api/v1/rfid/:uid/replace` - Replace RFID card
- `DELETE /api/v1/rfid/:uid` - Delete RFID card

#### Dashboard
- `GET /api/v1/dashboard/statistics` - Get dashboard statistics
- `GET /api/v1/dashboard/recent-activity` - Get recent attendance activity
- `GET /api/v1/dashboard/class-attendance` - Get class attendance overview

#### Reports
- `GET /api/v1/reports/daily/:date` - Daily attendance report
- `GET /api/v1/reports/weekly/:startDate` - Weekly attendance report
- `GET /api/v1/reports/monthly/:year/:month` - Monthly attendance report

#### Devices
- `GET /api/v1/devices` - Get all devices
- `GET /api/v1/devices/:id` - Get device by ID
- `POST /api/v1/devices` - Create new device
- `PUT /api/v1/devices/:id` - Update device
- `PUT /api/v1/devices/:id/status` - Update device status
- `DELETE /api/v1/devices/:id` - Delete device

#### Notifications
- `GET /api/v1/notifications/student/:studentId` - Get notification settings
- `PUT /api/v1/notifications/student/:studentId` - Update notification settings
- `GET /api/v1/notifications/logs` - Get notification logs
- `GET /api/v1/notifications/statistics` - Get notification statistics

## Arduino Setup

See `arduino/README.md` for detailed Arduino setup instructions.

### Quick Start

1. Install required libraries via Arduino Library Manager:
   - WiFiS3
   - ArduinoJson
   - MFRC522
   - LiquidCrystal_I2C

2. Configure WiFi and server settings in `rfid_attendance.ino`

3. Upload firmware to Arduino UNO R4 WiFi

4. Connect hardware according to wiring diagram

5. Power on and test with RFID card

## WhatsApp Configuration

### 1. Set Up WhatsApp Business Cloud API

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a Meta for Developers account
3. Create a WhatsApp Business App
4. Get your Phone Number ID and Access Token
5. Add your phone number to the app

### 2. Configure Backend

Update `.env` file with WhatsApp credentials:

```env
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_API_VERSION=v18.0
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
```

### 3. Test WhatsApp Integration

Register a student with a parent's WhatsApp number and test the attendance flow.

## Deployment

### Backend Deployment (e.g., Heroku, DigitalOcean, AWS)

1. Set environment variables in your hosting platform
2. Deploy the backend code
3. Ensure PostgreSQL database is accessible
4. Configure SSL/HTTPS for production

### Frontend Deployment (e.g., Vercel, Netlify, AWS S3)

1. Build the frontend: `npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Update environment variables for API URL
4. Configure CORS in backend to allow your frontend domain

### Database Deployment

1. Use managed PostgreSQL service (e.g., AWS RDS, Heroku Postgres)
2. Run schema migration on production database
3. Configure database backups
4. Set up read replicas if needed

## Security Considerations

### Backend Security
- Never commit `.env` files to version control
- Use strong, unique JWT secrets
- Implement rate limiting
- Use HTTPS in production
- Validate all user inputs
- Sanitize database queries (parameterized queries)
- Implement proper error handling without exposing sensitive data

### Arduino Security
- Use HTTPS for all communications
- Implement device authentication via API keys
- Never store sensitive data on Arduino
- Use secure WiFi connections
- Implement firmware updates securely

### Database Security
- Use strong database passwords
- Restrict database access to specific IPs
- Implement database encryption at rest
- Regular database backups
- Use read-only accounts for reporting

## Troubleshooting

### Backend Issues

**Database Connection Failed**
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists
- Check network connectivity

**WhatsApp Notifications Not Sending**
- Verify WhatsApp API credentials
- Check phone number format (include country code)
- Verify parent has WhatsApp enabled
- Check notification logs for errors

**Socket.IO Not Connecting**
- Verify Socket.IO server is running
- Check firewall settings
- Ensure correct WebSocket URL in frontend
- Check browser console for errors

### Frontend Issues

**API Requests Failing**
- Verify backend is running
- Check API URL in `.env`
- Verify CORS configuration
- Check browser console for errors

**Real-time Updates Not Working**
- Verify Socket.IO connection
- Check if user joined dashboard room
- Verify Socket.IO server configuration
- Check network connectivity

### Arduino Issues

**WiFi Not Connecting**
- Verify WiFi credentials
- Check WiFi network availability
- Ensure Arduino UNO R4 WiFi is properly connected
- Check Serial Monitor for error messages

**RFID Not Reading**
- Verify RC522 wiring connections
- Ensure 3.3V power supply is stable
- Check if RFID card is compatible
- Verify RFID card is not damaged

**Server Connection Failed**
- Verify server host and port
- Check if server is accessible
- Verify API key matches database
- Check SSL certificate validity

## Support

For issues and questions:
- Check the troubleshooting section
- Review API documentation
- Check Arduino wiring diagram
- Review database schema
- Check environment variable configuration

## License

This project is proprietary software. All rights reserved.
