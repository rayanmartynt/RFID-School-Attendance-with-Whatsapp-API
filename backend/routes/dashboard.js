const express = require('express');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');
const moment = require('moment');

const router = express.Router();

// Get dashboard statistics
router.get('/statistics', async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');

    // Student statistics
    const totalStudentsResult = await query(
      'SELECT COUNT(*) as count FROM students WHERE status = $1',
      ['ACTIVE']
    );

    const presentStudentsResult = await query(
      `SELECT COUNT(*) as count FROM attendance 
       WHERE date = $1 AND status IN ($2, $3)`,
      [today, 'PRESENT', 'LATE']
    );

    const absentStudentsResult = await query(
      `SELECT COUNT(*) as count FROM students s
       WHERE s.status = $1
       AND s.id NOT IN (SELECT student_id FROM attendance WHERE date = $2)`,
      ['ACTIVE', today]
    );

    const lateStudentsResult = await query(
      `SELECT COUNT(*) as count FROM attendance 
       WHERE date = $1 AND is_late = $2`,
      [today, true]
    );

    // Staff statistics
    const totalStaffResult = await query(
      'SELECT COUNT(*) as count FROM staff WHERE status = $1',
      ['ACTIVE']
    );

    const presentStaffResult = await query(
      `SELECT COUNT(*) as count FROM staff_attendance 
       WHERE date = $1 AND status = $2`,
      [today, 'PRESENT']
    );

    const absentStaffResult = await query(
      `SELECT COUNT(*) as count FROM staff s
       WHERE s.status = $1
       AND s.id NOT IN (SELECT staff_id FROM staff_attendance WHERE date = $2)`,
      ['ACTIVE', today]
    );

    // Calculate attendance rates
    const totalStudents = parseInt(totalStudentsResult.rows[0].count);
    const presentStudents = parseInt(presentStudentsResult.rows[0].count);
    const studentAttendanceRate = totalStudents > 0 
      ? Math.round((presentStudents / totalStudents) * 100) 
      : 0;

    const totalStaff = parseInt(totalStaffResult.rows[0].count);
    const presentStaff = parseInt(presentStaffResult.rows[0].count);
    const staffAttendanceRate = totalStaff > 0 
      ? Math.round((presentStaff / totalStaff) * 100) 
      : 0;

    res.json({
      students: {
        total: totalStudents,
        present: presentStudents,
        absent: parseInt(absentStudentsResult.rows[0].count),
        late: parseInt(lateStudentsResult.rows[0].count)
      },
      staff: {
        total: totalStaff,
        present: presentStaff,
        absent: parseInt(absentStaffResult.rows[0].count)
      },
      attendanceRate: {
        students: studentAttendanceRate,
        staff: staffAttendanceRate
      },
      date: today
    });
  } catch (error) {
    logger.error('Error fetching dashboard statistics', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent attendance activity
router.get('/recent-activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent student attendance
    const studentActivity = await query(
      `SELECT a.id, a.arrival_time, a.status, 
              s.first_name, s.last_name, c.grade, c.section,
              'STUDENT' as person_type
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE a.date = CURRENT_DATE
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    );

    // Get recent staff attendance
    const staffActivity = await query(
      `SELECT sa.id, sa.arrival_time, sa.status,
              s.first_name, s.last_name, s.department, s.position,
              'STAFF' as person_type
       FROM staff_attendance sa
       JOIN staff s ON sa.staff_id = s.id
       WHERE sa.date = CURRENT_DATE
       ORDER BY sa.created_at DESC
       LIMIT $1`,
      [limit]
    );

    // Combine and sort by time
    const allActivity = [
      ...studentActivity.rows.map(a => ({
        ...a,
        event: a.status === 'DEPARTED' ? 'DEPARTURE' : 'ARRIVAL',
        class: a.grade ? `${a.grade} ${a.section}` : null,
        department: a.department,
        position: a.position
      })),
      ...staffActivity.rows.map(a => ({
        ...a,
        event: a.status === 'DEPARTED' ? 'DEPARTURE' : 'PRESENT',
        class: null,
        department: a.department,
        position: a.position
      }))
    ].sort((a, b) => new Date(b.arrival_time) - new Date(a.arrival_time))
     .slice(0, limit);

    res.json({
      activity: allActivity
    });
  } catch (error) {
    logger.error('Error fetching recent activity', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get class attendance overview
router.get('/class-attendance', async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');

    const result = await query(
      `SELECT c.id, c.grade, c.section, c.capacity,
              COUNT(s.id) as total_students,
              COUNT(a.id) FILTER (WHERE a.status IN ('PRESENT', 'LATE')) as present,
              COUNT(a.id) FILTER (WHERE a.status = 'LATE') as late,
              COUNT(s.id) - COUNT(a.id) as absent
       FROM classes c
       LEFT JOIN students s ON c.id = s.class_id AND s.status = 'ACTIVE'
       LEFT JOIN attendance a ON s.id = a.student_id AND a.date = $1
       GROUP BY c.id, c.grade, c.section, c.capacity
       ORDER BY c.grade, c.section`,
      [today]
    );

    const classAttendance = result.rows.map(c => ({
      ...c,
      attendance_rate: c.total_students > 0 
        ? ((c.present / c.total_students) * 100).toFixed(1)
        : '0.0'
    }));

    res.json({
      date: today,
      classes: classAttendance
    });
  } catch (error) {
    logger.error('Error fetching class attendance', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
