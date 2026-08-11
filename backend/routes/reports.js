const express = require('express');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');
const moment = require('moment');

const router = express.Router();

// Generate daily attendance report
router.get('/daily/:date', async (req, res) => {
  try {
    const date = req.params.date || moment().format('YYYY-MM-DD');

    const studentAttendance = await query(
      `SELECT s.student_id, s.first_name, s.last_name, c.grade, c.section,
              a.arrival_time, a.departure_time, a.status, a.is_late,
              p.first_name as parent_first_name, p.last_name as parent_last_name,
              p.phone as parent_phone
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN parents p ON s.parent_id = p.id
       LEFT JOIN attendance a ON s.id = a.student_id AND a.date = $1
       WHERE s.status = 'ACTIVE'
       ORDER BY c.grade, c.section, s.last_name, s.first_name`,
      [date]
    );

    const staffAttendance = await query(
      `SELECT st.staff_id, st.first_name, st.last_name, st.department, st.position,
              sa.arrival_time, sa.departure_time, sa.status
       FROM staff st
       LEFT JOIN staff_attendance sa ON st.id = sa.staff_id AND sa.date = $1
       WHERE st.status = 'ACTIVE'
       ORDER BY st.department, st.last_name, st.first_name`,
      [date]
    );

    // Calculate statistics
    const totalStudents = studentAttendance.rows.length;
    const presentStudents = studentAttendance.rows.filter(s => 
      s.status && (s.status === 'PRESENT' || s.status === 'LATE')
    ).length;
    const absentStudents = totalStudents - presentStudents;
    const lateStudents = studentAttendance.rows.filter(s => s.is_late).length;

    const totalStaff = staffAttendance.rows.length;
    const presentStaff = staffAttendance.rows.filter(s => s.status === 'PRESENT').length;
    const absentStaff = totalStaff - presentStaff;

    res.json({
      date,
      summary: {
        students: {
          total: totalStudents,
          present: presentStudents,
          absent: absentStudents,
          late: lateStudents,
          attendanceRate: totalStudents > 0 ? ((presentStudents / totalStudents) * 100).toFixed(1) : 0
        },
        staff: {
          total: totalStaff,
          present: presentStaff,
          absent: absentStaff,
          attendanceRate: totalStaff > 0 ? ((presentStaff / totalStaff) * 100).toFixed(1) : 0
        }
      },
      studentAttendance: studentAttendance.rows,
      staffAttendance: staffAttendance.rows
    });
  } catch (error) {
    logger.error('Error generating daily report', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate weekly attendance report
router.get('/weekly/:startDate', async (req, res) => {
  try {
    const startDate = req.params.startDate;
    const endDate = moment(startDate).add(6, 'days').format('YYYY-MM-DD');

    const studentAttendance = await query(
      `SELECT s.student_id, s.first_name, s.last_name, c.grade, c.section,
              COUNT(a.id) FILTER (WHERE a.status IN ('PRESENT', 'LATE')) as days_present,
              COUNT(a.id) FILTER (WHERE a.is_late) as days_late,
              COUNT(DISTINCT a.date) as total_days_recorded
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN attendance a ON s.id = a.student_id AND a.date BETWEEN $1 AND $2
       WHERE s.status = 'ACTIVE'
       GROUP BY s.id, s.student_id, s.first_name, s.last_name, c.grade, c.section
       ORDER BY c.grade, c.section, s.last_name, s.first_name`,
      [startDate, endDate]
    );

    const staffAttendance = await query(
      `SELECT st.staff_id, st.first_name, st.last_name, st.department, st.position,
              COUNT(sa.id) FILTER (WHERE sa.status = 'PRESENT') as days_present,
              COUNT(DISTINCT sa.date) as total_days_recorded
       FROM staff st
       LEFT JOIN staff_attendance sa ON st.id = sa.staff_id AND sa.date BETWEEN $1 AND $2
       WHERE st.status = 'ACTIVE'
       GROUP BY st.id, st.staff_id, st.first_name, st.last_name, st.department, st.position
       ORDER BY st.department, st.last_name, st.first_name`,
      [startDate, endDate]
    );

    res.json({
      startDate,
      endDate,
      studentAttendance: studentAttendance.rows,
      staffAttendance: staffAttendance.rows
    });
  } catch (error) {
    logger.error('Error generating weekly report', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate monthly attendance report
router.get('/monthly/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = moment(`${year}-${month}-01`).format('YYYY-MM-DD');
    const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');

    const studentAttendance = await query(
      `SELECT s.student_id, s.first_name, s.last_name, c.grade, c.section,
              COUNT(a.id) FILTER (WHERE a.status IN ('PRESENT', 'LATE')) as days_present,
              COUNT(a.id) FILTER (WHERE a.is_late) as days_late
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN attendance a ON s.id = a.student_id AND a.date BETWEEN $1 AND $2
       WHERE s.status = 'ACTIVE'
       GROUP BY s.id, s.student_id, s.first_name, s.last_name, c.grade, c.section
       ORDER BY c.grade, c.section, s.last_name, s.first_name`,
      [startDate, endDate]
    );

    res.json({
      year,
      month,
      startDate,
      endDate,
      studentAttendance: studentAttendance.rows
    });
  } catch (error) {
    logger.error('Error generating monthly report', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate class attendance report
router.get('/class/:classId/:date', async (req, res) => {
  try {
    const { classId, date } = req.params;

    const result = await query(
      `SELECT s.student_id, s.first_name, s.last_name,
              a.arrival_time, a.departure_time, a.status, a.is_late,
              p.first_name as parent_first_name, p.last_name as parent_last_name,
              p.phone as parent_phone
       FROM students s
       LEFT JOIN attendance a ON s.id = a.student_id AND a.date = $1
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE s.class_id = $2 AND s.status = 'ACTIVE'
       ORDER BY s.last_name, s.first_name`,
      [date, classId]
    );

    const totalStudents = result.rows.length;
    const presentStudents = result.rows.filter(s => 
      s.status && (s.status === 'PRESENT' || s.status === 'LATE')
    ).length;
    const absentStudents = totalStudents - presentStudents;
    const lateStudents = result.rows.filter(s => s.is_late).length;

    res.json({
      classId,
      date,
      summary: {
        total: totalStudents,
        present: presentStudents,
        absent: absentStudents,
        late: lateStudents,
        attendanceRate: totalStudents > 0 ? ((presentStudents / totalStudents) * 100).toFixed(1) : 0
      },
      students: result.rows
    });
  } catch (error) {
    logger.error('Error generating class report', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate student attendance history
router.get('/student/:studentId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const queryStartDate = startDate || moment().startOf('month').format('YYYY-MM-DD');
    const queryEndDate = endDate || moment().format('YYYY-MM-DD');

    const result = await query(
      `SELECT a.*, c.grade, c.section
       FROM attendance a
       LEFT JOIN students s ON a.student_id = s.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE a.student_id = $1 AND a.date BETWEEN $2 AND $3
       ORDER BY a.date DESC`,
      [req.params.studentId, queryStartDate, queryEndDate]
    );

    const totalDays = result.rows.length;
    const presentDays = result.rows.filter(a => a.status === 'PRESENT').length;
    const lateDays = result.rows.filter(a => a.is_late).length;
    const absentDays = totalDays - presentDays;

    res.json({
      studentId: req.params.studentId,
      startDate: queryStartDate,
      endDate: queryEndDate,
      summary: {
        totalDays,
        presentDays,
        lateDays,
        absentDays,
        attendanceRate: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0
      },
      attendance: result.rows
    });
  } catch (error) {
    logger.error('Error generating student history', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
