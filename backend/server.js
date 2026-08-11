require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const staffRoutes = require('./routes/staff');
const parentRoutes = require('./routes/parents');
const classRoutes = require('./routes/classes');
const attendanceRoutes = require('./routes/attendance');
const staffAttendanceRoutes = require('./routes/staffAttendance');
const rfidRoutes = require('./routes/rfid');
const deviceRoutes = require('./routes/devices');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const excelRoutes = require('./routes/excel');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-dashboard', () => {
    socket.join('dashboard');
    logger.info(`Socket ${socket.id} joined dashboard room`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', authenticateToken, studentRoutes);
app.use('/api/v1/staff', authenticateToken, staffRoutes);
app.use('/api/v1/parents', authenticateToken, parentRoutes);
app.use('/api/v1/classes', authenticateToken, classRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/staff-attendance', staffAttendanceRoutes);
app.use('/api/v1/rfid', rfidRoutes);
app.use('/api/v1/devices', authenticateToken, deviceRoutes);
app.use('/api/v1/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/v1/notifications', authenticateToken, notificationRoutes);
app.use('/api/v1/reports', authenticateToken, reportRoutes);
app.use('/api/v1/excel', authenticateToken, excelRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
