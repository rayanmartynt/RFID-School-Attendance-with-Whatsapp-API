const express = require('express');
const { query, getClient } = require('../config/database');
const { logger } = require('../utils/logger');
const moment = require('moment');

const router = express.Router();

// RFID Tap endpoint for staff (no auth - for Arduino devices)
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
    const cooldownMinutes = parseInt(process.env.DUPLICATE_SCAN_COOLDOWN_MINUTES || 5);

    // Check for duplicate scan within cooldown period
    const cooldownTime = moment().subtract(cooldownMinutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');

    if (rfidCard.person_type === 'STAFF') {
      // Staff attendance logic - NO WhatsApp notification
      const staffResult = await client.query(
        'SELECT * FROM staff WHERE id = $1',
        [rfidCard.person_id]
      );

      if (staffResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Staff not found' });
      }

      const staff = staffResult.rows[0];

      // Check for recent attendance
      const recentAttendance = await client.query(
        `SELECT * FROM staff_attendance 
         WHERE staff_id = $1 AND date = $2 
         AND created_at > $3`,
        [staff.id, currentDate, cooldownTime]
      );

      if (recentAttendance.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Duplicate scan - cooldown period active' });
      }

      // Get existing attendance for today
      const existingAttendance = await client.query(
        'SELECT * FROM staff_attendance WHERE staff_id = $1 AND date = $2',
        [staff.id, currentDate]
      );

      let attendanceRecord;
      let event;

      if (existingAttendance.rows.length === 0) {
        // First scan - Arrival (PRESENT)
        event = 'PRESENT';
        attendanceRecord = await client.query(
          `INSERT INTO staff_attendance (staff_id, device_id, date, arrival_time, status)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [staff.id, deviceId, currentDate, currentTime, 'PRESENT']
        );
      } else {
        // Second scan - Departure
        event = 'DEPARTURE';
        attendanceRecord = await client.query(
          `UPDATE staff_attendance 
           SET departure_time = $1, status = 'DEPARTED'
           WHERE id = $2
           RETURNING *`,
          [currentTime, existingAttendance.rows[0].id]
        );
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
        personType: 'STAFF',
        event: event,
        name: `${staff.first_name} ${staff.last_name}`,
        department: staff.department,
        position: staff.position,
        time: moment(currentTime, 'HH:mm:ss').format('h:mm A')
      });

      logger.info('Staff attendance recorded', {
        staffId: staff.id,
        event: event,
        time: currentTime
      });

      res.json({
        success: true,
        personType: 'STAFF',
        event: event,
        name: `${staff.first_name} ${staff.last_name}`,
        time: currentTime,
        status: attendanceRecord.rows[0].status
      });

    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid person type for staff attendance' });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Staff attendance tap error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get staff attendance
router.get('/', async (req, res) => {
  try {
    const { date, department, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const queryDate = date || moment().format('YYYY-MM-DD');

    let queryText = `
      SELECT sa.*, s.staff_id, s.first_name, s.last_name, 
             s.department, s.position
      FROM staff_attendance sa
      JOIN staff s ON sa.staff_id = s.id
      WHERE sa.date = $1
    `;
    const params = [queryDate];
    let paramCount = 2;

    if (department) {
      queryText += ` AND s.department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    if (status) {
      queryText += ` AND sa.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ` ORDER BY sa.arrival_time DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
    logger.error('Error fetching staff attendance', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
