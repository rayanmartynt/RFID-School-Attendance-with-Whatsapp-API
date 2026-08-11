# API Documentation

## Base URL

```
Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Login Endpoint

No authentication required.

## Endpoints

### Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@school.edu",
    "firstName": "System",
    "lastName": "Administrator",
    "role": "ADMIN"
  }
}
```

#### Verify Token
```http
GET /auth/verify
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "ADMIN"
  }
}
```

### Students

#### Get All Students
```http
GET /students?page=1&limit=10&search=John&classId=1&status=ACTIVE
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or student ID
- `classId` (optional): Filter by class ID
- `status` (optional): Filter by status

**Response:**
```json
{
  "students": [
    {
      "id": 1,
      "student_id": "STU00125",
      "first_name": "John",
      "last_name": "Kamara",
      "grade": "Grade 10",
      "section": "A",
      "parent_first_name": "Mary",
      "parent_last_name": "Kamara",
      "parent_phone": "+23278123456",
      "rfid_uid": "A37B9122",
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1250,
    "pages": 125
  }
}
```

#### Get Student by ID
```http
GET /students/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "student_id": "STU00125",
  "first_name": "John",
  "last_name": "Kamara",
  "gender": "Male",
  "date_of_birth": "2008-05-15",
  "class_id": 1,
  "parent_id": 1,
  "rfid_uid": "A37B9122",
  "status": "ACTIVE"
}
```

#### Create Student
```http
POST /students
Authorization: Bearer <token>
Content-Type: application/json

{
  "student_id": "STU00126",
  "first_name": "Sarah",
  "last_name": "Conteh",
  "gender": "Female",
  "date_of_birth": "2008-08-22",
  "class_id": 2,
  "parent_id": 2,
  "rfid_uid": "B4921137",
  "status": "ACTIVE"
}
```

#### Update Student
```http
PUT /students/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "Sarah",
  "last_name": "Conteh",
  "class_id": 2,
  "status": "ACTIVE"
}
```

#### Delete Student
```http
DELETE /students/:id
Authorization: Bearer <token>
```

### Staff

#### Get All Staff
```http
GET /staff?page=1&limit=10&search=Abdul&department=IT&status=ACTIVE
Authorization: Bearer <token>
```

**Response:**
```json
{
  "staff": [
    {
      "id": 1,
      "staff_id": "STAFF001",
      "first_name": "Abdul Karim",
      "last_name": "Koroma",
      "position": "Lecturer",
      "department": "Information Technology",
      "phone_number": "+23277123456",
      "rfid_uid": "B4921137",
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 85,
    "pages": 9
  }
}
```

#### Create Staff
```http
POST /staff
Authorization: Bearer <token>
Content-Type: application/json

{
  "staff_id": "STAFF002",
  "first_name": "Fatmata",
  "last_name": "Bangura",
  "gender": "Female",
  "date_of_birth": "1985-07-22",
  "position": "Teacher",
  "department": "Mathematics",
  "phone_number": "+23277234567",
  "email": "fatmata@school.edu",
  "employment_type": "FULL_TIME",
  "status": "ACTIVE"
}
```

### Attendance

#### RFID Tap (No Authentication - For Arduino)
```http
POST /attendance/tap
Content-Type: application/json
X-API-Key: gate001_api_key_secret

{
  "deviceId": "GATE-001",
  "rfidUid": "A37B9122"
}
```

**Response (Student Arrival):**
```json
{
  "success": true,
  "personType": "STUDENT",
  "event": "ARRIVAL",
  "name": "John Kamara",
  "time": "07:42:15",
  "status": "PRESENT"
}
```

**Response (Student Departure):**
```json
{
  "success": true,
  "personType": "STUDENT",
  "event": "DEPARTURE",
  "name": "John Kamara",
  "time": "16:18:30",
  "status": "DEPARTED"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "RFID card not found or inactive"
}
```

#### Get Student Attendance
```http
GET /attendance?date=2024-01-15&classId=1&status=PRESENT
Authorization: Bearer <token>
```

**Response:**
```json
{
  "attendance": [
    {
      "id": 1,
      "student_id": "STU00125",
      "first_name": "John",
      "last_name": "Kamara",
      "grade": "Grade 10",
      "section": "A",
      "arrival_time": "07:42:00",
      "departure_time": "16:18:00",
      "status": "PRESENT",
      "is_late": false
    }
  ],
  "date": "2024-01-15",
  "pagination": {
    "page": 1,
    "limit": 10
  }
}
```

#### Get Absent Students
```http
GET /attendance/absent/:date
Authorization: Bearer <token>
```

### Staff Attendance

#### Staff RFID Tap (No Authentication - For Arduino)
```http
POST /staff-attendance/tap
Content-Type: application/json
X-API-Key: gate001_api_key_secret

{
  "deviceId": "GATE-001",
  "rfidUid": "B4921137"
}
```

**Response (Staff Arrival):**
```json
{
  "success": true,
  "personType": "STAFF",
  "event": "PRESENT",
  "name": "Abdul Karim Koroma",
  "time": "07:31:02",
  "status": "PRESENT"
}
```

**Note:** NO WhatsApp notification is sent for staff attendance.

#### Get Staff Attendance
```http
GET /staff-attendance?date=2024-01-15&department=IT&status=PRESENT
Authorization: Bearer <token>
```

### RFID Cards

#### Get All RFID Cards
```http
GET /rfid?personType=STUDENT&status=ACTIVE
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "rfid_uid": "A37B9122",
    "person_type": "STUDENT",
    "person_id": 1,
    "person_name": "John Kamara",
    "person_id_code": "STU00125",
    "status": "ACTIVE",
    "device_id": "GATE-001",
    "last_used": "2024-01-15T07:42:15.000Z"
  }
]
```

#### Register RFID Card
```http
POST /rfid/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "rfidUid": "A37B9122",
  "personType": "STUDENT",
  "personId": 1,
  "deviceId": "GATE-001"
}
```

#### Update Card Status
```http
PUT /rfid/:uid/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "DISABLED"
}
```

### Dashboard

#### Get Statistics
```http
GET /dashboard/statistics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "students": {
    "total": 1250,
    "present": 1075,
    "absent": 125,
    "late": 50
  },
  "staff": {
    "total": 85,
    "present": 78,
    "absent": 7
  },
  "attendanceRate": {
    "students": 86,
    "staff": 92
  },
  "date": "2024-01-15"
}
```

#### Get Recent Activity
```http
GET /dashboard/recent-activity?limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "activity": [
    {
      "personType": "STUDENT",
      "event": "ARRIVAL",
      "name": "John Kamara",
      "class": "Grade 10A",
      "time": "07:42 AM"
    },
    {
      "personType": "STAFF",
      "event": "PRESENT",
      "name": "Abdul Karim Koroma",
      "department": "Information Technology",
      "position": "Lecturer",
      "time": "07:31 AM"
    }
  ]
}
```

### Reports

#### Daily Report
```http
GET /reports/daily/:date
Authorization: Bearer <token>
```

**Response:**
```json
{
  "date": "2024-01-15",
  "summary": {
    "students": {
      "total": 1250,
      "present": 1075,
      "absent": 125,
      "late": 50,
      "attendanceRate": 86.0
    },
    "staff": {
      "total": 85,
      "present": 78,
      "absent": 7,
      "attendanceRate": 91.8
    }
  },
  "studentAttendance": [...],
  "staffAttendance": [...]
}
```

### Devices

#### Get All Devices
```http
GET /devices
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "device_id": "GATE-001",
    "device_name": "Main Entrance Reader",
    "location": "Main Gate",
    "device_type": "ENTRANCE_READER",
    "status": "ONLINE",
    "api_key": "gate001_api_key_secret",
    "last_seen": "2024-01-15T07:42:15.000Z"
  }
]
```

#### Create Device
```http
POST /devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "device_id": "GATE-003",
  "device_name": "Back Entrance Reader",
  "location": "Back Gate",
  "device_type": "ENTRANCE_READER",
  "api_key": "gate003_api_key_secret"
}
```

### Notifications

#### Get Notification Logs
```http
GET /notifications/logs?studentId=1&status=SENT
Authorization: Bearer <token>
```

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "student_id": 1,
      "parent_id": 1,
      "notification_type": "ARRIVAL",
      "message": "Arrival notification for John Kamara",
      "phone_number": "+23278123456",
      "status": "SENT",
      "whatsapp_message_id": "wamid...",
      "sent_at": "2024-01-15T07:42:20.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10
  }
}
```

#### Get Notification Statistics
```http
GET /notifications/statistics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "date": "2024-01-15",
  "totalSent": 150,
  "totalFailed": 5,
  "byType": [
    {
      "notification_type": "ARRIVAL",
      "count": 75
    },
    {
      "notification_type": "DEPARTURE",
      "count": 75
    }
  ]
}
```

## Error Responses

All endpoints may return error responses:

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or invalid
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `500 Internal Server Error` - Server error

## WebSocket Events

### Client → Server

#### Join Dashboard Room
```javascript
socket.emit('join-dashboard')
```

### Server → Client

#### Attendance Update
```javascript
socket.on('attendance-update', (data) => {
  console.log(data);
  // {
  //   personType: "STUDENT",
  //   event: "ARRIVAL",
  //   name: "John Kamara",
  //   class: "Grade 10A",
  //   time: "07:42 AM"
  // }
});
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 1000 requests per 15 minutes per IP
- Exceeding limits returns `429 Too Many Requests`

## CORS

Cross-Origin Resource Sharing is configured to allow requests from the frontend URL specified in the `FRONTEND_URL` environment variable.
