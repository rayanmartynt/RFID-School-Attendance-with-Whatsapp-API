import express from 'express';
import { db } from '../db/index.js';
import { students, staff, attendance, staffAttendance, classes, parents } from '../db/schema.js';
import { eq, and, sql, desc, between } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import moment from 'moment';

const router = express.Router();

// Generate daily attendance report
router.get('/daily/:date', async (req, res) => {
  try {
    const date = req.params.date || moment().format('YYYY-MM-DD');

    const studentAttendance = await db
      .select({
        studentId: students.studentId,
        firstName: students.firstName,
        lastName: students.lastName,
        grade: classes.grade,
        section: classes.section,
        arrivalTime: attendance.arrivalTime,
        departureTime: attendance.departureTime,
        status: attendance.status,
        isLate: attendance.isLate,
        parentFirstName: parents.firstName,
        parentLastName: parents.lastName,
        parentPhone: parents.phone
      })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .leftJoin(parents, eq(students.parentId, parents.id))
      .leftJoin(attendance, and(eq(students.id, attendance.studentId), sql`DATE(${attendance.date}) = ${date}`))
      .where(eq(students.status, 'ACTIVE'))
      .orderBy(classes.grade, classes.section, students.lastName, students.firstName);

    const staffAttendance = await db
      .select({
        staffId: staff.staffId,
        firstName: staff.firstName,
        lastName: staff.lastName,
        department: staff.department,
        position: staff.position,
        arrivalTime: staffAttendance.arrivalTime,
        departureTime: staffAttendance.departureTime,
        status: staffAttendance.status
      })
      .from(staff)
      .leftJoin(staffAttendance, and(eq(staff.id, staffAttendance.staffId), sql`DATE(${staffAttendance.date}) = ${date}`))
      .where(eq(staff.status, 'ACTIVE'))
      .orderBy(staff.department, staff.lastName, staff.firstName);

    const totalStudents = studentAttendance.length;
    const presentStudents = studentAttendance.filter(s => 
      s.status && (s.status === 'PRESENT' || s.status === 'LATE')
    ).length;
    const absentStudents = totalStudents - presentStudents;
    const lateStudents = studentAttendance.filter(s => s.isLate).length;

    const totalStaff = staffAttendance.length;
    const presentStaff = staffAttendance.filter(s => s.status === 'PRESENT').length;
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
      studentAttendance,
      staffAttendance
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

    const studentAttendance = await db
      .select({
        studentId: students.studentId,
        firstName: students.firstName,
        lastName: students.lastName,
        grade: classes.grade,
        section: classes.section
      })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(eq(students.status, 'ACTIVE'))
      .orderBy(classes.grade, classes.section, students.lastName, students.firstName);

    const staffAttendance = await db
      .select({
        staffId: staff.staffId,
        firstName: staff.firstName,
        lastName: staff.lastName,
        department: staff.department,
        position: staff.position
      })
      .from(staff)
      .where(eq(staff.status, 'ACTIVE'))
      .orderBy(staff.department, staff.lastName, staff.firstName);

    res.json({
      startDate,
      endDate,
      studentAttendance,
      staffAttendance
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

    const studentAttendance = await db
      .select({
        studentId: students.studentId,
        firstName: students.firstName,
        lastName: students.lastName,
        grade: classes.grade,
        section: classes.section
      })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(eq(students.status, 'ACTIVE'))
      .orderBy(classes.grade, classes.section, students.lastName, students.firstName);

    res.json({
      year,
      month,
      startDate,
      endDate,
      studentAttendance
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

    const result = await db
      .select({
        studentId: students.studentId,
        firstName: students.firstName,
        lastName: students.lastName,
        arrivalTime: attendance.arrivalTime,
        departureTime: attendance.departureTime,
        status: attendance.status,
        isLate: attendance.isLate,
        parentFirstName: parents.firstName,
        parentLastName: parents.lastName,
        parentPhone: parents.phone
      })
      .from(students)
      .leftJoin(attendance, and(eq(students.id, attendance.studentId), sql`DATE(${attendance.date}) = ${date}`))
      .leftJoin(parents, eq(students.parentId, parents.id))
      .where(and(eq(students.classId, parseInt(classId)), eq(students.status, 'ACTIVE')))
      .orderBy(students.lastName, students.firstName);

    const totalStudents = result.length;
    const presentStudents = result.filter(s => 
      s.status && (s.status === 'PRESENT' || s.status === 'LATE')
    ).length;
    const absentStudents = totalStudents - presentStudents;
    const lateStudents = result.filter(s => s.isLate).length;

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
      students: result
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

    const result = await db
      .select({
        attendance,
        grade: classes.grade,
        section: classes.section
      })
      .from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(
        and(
          eq(attendance.studentId, parseInt(req.params.studentId)),
          sql`DATE(${attendance.date}) BETWEEN ${queryStartDate} AND ${queryEndDate}`
        )
      )
      .orderBy(desc(attendance.date));

    const totalDays = result.length;
    const presentDays = result.filter(a => a.attendance.status === 'PRESENT').length;
    const lateDays = result.filter(a => a.attendance.isLate).length;
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
      attendance: result.map(r => r.attendance)
    });
  } catch (error) {
    logger.error('Error generating student history', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
