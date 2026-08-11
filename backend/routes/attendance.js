const express = require('express');
const { query, getClient } = require('../config/database');
const { logger } = require('../utils/logger');
const whatsappService = require('../utils/whatsappService');
const moment = require('moment');

const router = express.Router();

// RFID Tap endpoint (no auth - for Arduino devices)
router.post('/tap', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { deviceId, rfidUid } = req.body;

    if (!deviceId || !rfidUid) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'deviceId and rfidUid are required' });
    }

    // Verify device
    const deviceResult = await client.query(
      'SELECT * FROM devices WHERE device_id = $1 AND status = $2',
      [deviceId, 'ONLINE']
    );

    if (deviceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Device not found or offline' });
    }

    // Update device last_seen
    await client.query(
      'UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE device_id = $1',
      [deviceId]
    );

    // Check RFID card
    const rfidResult = await client.query(
      'SELECT * FROM rfid_cards WHERE rfid_uid = $1 AND status = $2',
      [rfidUid, 'ACTIVE']
    );

    if (rfidResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'RFID card not found or inactive' });
    }

    const rfidCard = rfidResult.rows[0];
    const currentTime = moment().format('HH:mm:ss');
    const currentDate = moment().format('YYYY-MM-DD');
    const schoolStartTime = process.env.SCHOOL_TIME_START || '08:00';
    const lateThreshold = parseInt(process.env.LATE_THRESHOLD_MINUTES || 15);
    const cooldownMinutes = parseInt(process.env.DUPLICATE_SCAN_COOLDOWN_MINUTES || 5);

    // Check for duplicate scan within cooldown period
    const cooldownTime = moment().subtract(cooldownMinutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');

    if (rfidCard.person_type === 'STUDENT') {
      // Student attendance logic
      const studentResult = await client.query(
        `SELECT s.*, p.first_name as parent_first_name, p.last_name as parent_last_name,
                p.whatsapp_number, c.grade, c.section
         FROM students s
         LEFT JOIN parents p ON s.parent_id = p.id
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE s.id = $1`,
        [rfidCard.person_id]
      );

      if (studentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Student not found' });
      }

      const student = studentResult.rows[0];

      // Check for recent attendance
      const recentAttendance = await client.query(
        `SELECT * FROM attendance 
         WHERE student_id = $1 AND date = $2 
         AND created_at > $3`,
        [student.id, currentDate, cooldownTime]
      );

      if (recentAttendance.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Duplicate scan - cooldown period active' });
      }

      // Get existing attendance for today
      const existingAttendance = await client.query(
        'SELECT * FROM attendance WHERE student_id = $1 AND date = $2',
        [student.id, currentDate]
      );

      let attendanceRecord;
      let event;
      let isLate = moment(currentTime, 'HH:mm:ss').isAfter(
        moment(schoolStartTime, 'HH:mm:ss').add(lateThreshold, 'minutes')
      );

      if (existingAttendance.rows.length === 0) {
        // First scan - Arrival
        event = 'ARRIVAL';
        const status = isLate ? 'LATE' : 'PRESENT';

        attendanceRecord = await client.query(
          `INSERT INTO attendance (student_id, device_id, date, arrival_time, status, is_late)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [student.id, deviceId, currentDate, currentTime, status, isLate]
        );

        // Send WhatsApp notification for arrival
        if (student.whatsapp_number && student.parent_first_name) {
          const notificationResult = await whatsappService.sendArrivalNotification(
            student.parent_first_name,
            `${student.first_name} ${student.last_name}`,
            process.env.SCHOOL_NAME || 'ABC School',
            student.whatsapp_number,
            moment(currentTime, 'HH:mm:ss').format('h:mm A')
          );

          // Log notification
          await client.query(
            `INSERT INTO notification_logs (student_id, parent_id, notification_type, 
                                            message, phone_number, status, whatsapp_message_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              student.id,
              student.parent_id,
              'ARRIVAL',
              `Arrival notification for ${student.first_name} ${student.last_name}`,
              student.whatsapp_number,
              notificationResult.success ? 'SENT' : 'FAILED',
              notificationResult.success ? notificationResult.messageId : null
            ]
          );
        }
      } else {
        // Second scan - Departure
        event = 'DEPARTURE';
        attendanceRecord = await client.query(
          `UPDATE attendance 
           SET departure_time = $1, status = 'DEPARTED'
           WHERE id = $2
           RETURNING *`,
          [currentTime, existingAttendance.rows[0].id]
        );

        // Send WhatsApp notification for departure
        if (student.whatsapp_number && student.parent_first_name) {
          const notificationResult = await whatsappService.sendDepartureNotification(
            student.parent_first_name,
            `${student.first_name} ${student.last_name}`,
            process.env.SCHOOL_NAME || 'ABC School',
            student.whatsapp_number,
            moment(currentTime, 'HH:mm:ss').format('h:mm A')
          );

          // Log notification
          await client.query(
            `INSERT INTO notification_logs (student_id, parent_id, notification_type, 
                                            message, phone_number, status, whatsapp_message_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              student.id,
              student.parent_id,
              'DEPARTURE',
              `Departure notification for ${student.first_name} ${student.last_name}`,
              student.whatsapp_number,
              notificationResult.success ? 'SENT' : 'FAILED',
              notificationResult.success ? notificationResult.messageId : null
            ]
          );
        }
      }

      // Update RFID card last_used
      await client.query(
        'UPDATE rfid_cards SET last_used = CURRENT_TIMESTAMP WHERE id = $1',
        [rfidCard.id]
      );

      await client.query('COMMIT');

      // Emit real-time update
      const io = req.app.get('io');
      io.to('dashboard').emit('attendance-update', {
        personType: 'STUDENT',
        event: event,
        name: `${student.first_name} ${student.last_name}`,
        class: grade ? `${grade} ${section}` : 'N/A',
        time: moment(currentTime, 'HH:mm:ss').format('h:mm A')
      });

      res.json({
        success: true,
        personType: 'STUDENT',
        event: event,
        name: `${student.first_name} ${student.last_name}`,
        time: currentTime,
        status: attendanceRecord.rows[0].status
      });

    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid person type' });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Attendance tap error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get student attendance
router.get('/', async (req, res) => {
  try {
    const { date, classId, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const queryDate = date || moment().format('YYYY-MM-DD');

    let queryText = `
      SELECT a.*, s.student_id, s.first_name, s.last_name, 
             c.grade, c.section, p.first_name as parent_first_name,
             p.last_name as parent_last_name, p.phone as parent_phone
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN parents p ON s.parent_id = p.id
      WHERE a.date = $1
    `;
    const params = [queryDate];
    let paramCount = 2;

    if (classId) {
      queryText += ` AND s.class_id = $${paramCount}`;
      params.push(classId);
      paramCount++;
    }

    if (status) {
      queryText += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ` ORDER BY a.arrival_time DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json({
      attendance: result.rows,
      date: queryDate,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching attendance', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get absent students for a date
router.get('/absent/:date', async (req, res) => {
  try {
    const date = req.params.date || moment().format('YYYY-MM-DD');

    const result = await query(
      `SELECT s.student_id, s.first_name, s.last_name, c.grade, c.section,
              p.first_name as parent_first_name, p.last_name as parent_last_name,
              p.phone as parent_phone
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE s.status = 'ACTIVE'
       AND s.id NOT IN (
         SELECT student_id FROM attendance WHERE date = $1
       )
       ORDER BY s.last_name, s.first_name`,
      [date]
    );

    res.json({
      date,
      absentStudents: result.rows
    });
  } catch (error) {
    logger.error('Error fetching absent students', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
