# RFID School Attendance System with WhatsApp API

A comprehensive school attendance management system that uses RFID technology for automated attendance tracking and WhatsApp Business API for parent notifications.

## Features

- **RFID-based Attendance Tracking**: Automated student and staff attendance using RFID cards
- **Real-time Dashboard**: Live attendance statistics and activity monitoring
- **WhatsApp Notifications**: Automatic parent notifications for student arrivals/departures
- **Multi-user Support**: Separate interfaces for students, staff, parents, and administrators
- **Class Management**: Organize students by classes and sections
- **Attendance Reports**: Generate daily, weekly, and monthly attendance reports
- **Dark/Light Theme**: Professional UI with theme toggle support
- **Device Management**: Manage multiple RFID reader devices
- **Excel Import/Export**: Bulk data management capabilities

## Tech Stack

### Frontend
- React 18 with Vite
- React Router for navigation
- Axios for API calls
- Tailwind CSS for styling
- Lucide React for icons
- Chart.js for data visualization
- date-fns for date handling

### Backend
- Node.js with Express
- Drizzle ORM for database operations
- PostgreSQL (Supabase)
- Socket.IO for real-time updates
- JWT for authentication
- bcrypt for password hashing
- Winston for logging

### Hardware
- Arduino-compatible microcontroller
- RC522 RFID reader module
- ESP8266/ESP32 for WiFi connectivity

## Project Structure

```
RFID-School-Attendance-with-Whatsapp-API/
├── backend/                 # Node.js/Express backend
│   ├── db/                 # Drizzle schema and migrations
│   ├── middleware/         # Authentication middleware
│   ├── routes/             # API route handlers
│   ├── utils/              # Utility functions
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React contexts (Auth, Theme)
│   │   └── pages/          # Page components
│   └── public/             # Static assets
├── arduino/                # Arduino firmware
│   └── rfid_attendance/    # RFID reader code
└── docs/                   # Documentation (gitignored)
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (Supabase recommended)
- Arduino IDE for firmware upload
- RC522 RFID module
- ESP8266/ESP32 board

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rayanmartynt/RFID-School-Attendance-with-Whatsapp-API.git
   cd RFID-School-Attendance-with-Whatsapp-API
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your environment variables in .env
   npx drizzle-kit push
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Configure your environment variables in .env
   npm run dev
   ```

4. **Arduino Setup**
   - Open `arduino/rfid_attendance/rfid_attendance.ino` in Arduino IDE
   - Install required libraries (MFRC522, ESP8266WiFi, ArduinoJson)
   - Configure WiFi credentials and API endpoint
   - Upload to your ESP8266/ESP32 board

### Environment Variables

**Frontend (.env)**
```
VITE_API_URL=http://localhost:5000
```

## Default Credentials

After initial setup, create an admin account via:
```bash
POST http://localhost:5000/api/v1/auth/setup
{
  "username": "admin",
  "password": "admin123",
  "email": "admin@school.com"
}
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/setup` - Create admin account
- `GET /api/v1/auth/verify` - Verify JWT token

### Students
- `GET /api/v1/students` - List all students
- `POST /api/v1/students` - Create student
- `PUT /api/v1/students/:id` - Update student
- `DELETE /api/v1/students/:id` - Delete student

### Staff
- `GET /api/v1/staff` - List all staff
- `POST /api/v1/staff` - Create staff
- `PUT /api/v1/staff/:id` - Update staff
- `DELETE /api/v1/staff/:id` - Delete staff

### RFID
- `POST /api/v1/rfid/scan` - Record RFID scan
- `POST /api/v1/rfid/register` - Register RFID card
- `GET /api/v1/rfid` - List all RFID cards

### Dashboard
- `GET /api/v1/dashboard/statistics` - Get attendance statistics
- `GET /api/v1/dashboard/recent-activity` - Get recent activity
- `GET /api/v1/dashboard/class-attendance` - Get class-wise attendance

## Hardware Setup

### Components
- ESP8266/ESP32 microcontroller
- RC522 RFID reader
- Jumper wires
- Breadboard

### Wiring
```
RC522    ESP8266/ESP32
-----------------------
SDA      D8/IO15
SCK      D5/IO14
MOSI     D7/IO13
MISO     D6/IO12
RST      D3/IO0
3.3V     3.3V
GND      GND
```

## License

This project is proprietary software. All rights reserved.
