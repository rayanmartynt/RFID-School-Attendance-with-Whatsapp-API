import express from 'express';
import { db } from '../db/index.js';
import { students, staff, attendance, staffAttendance, classes } from '../db/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import moment from 'moment';

const router = express.Router();

// Get dashboard statistics
router.get('/statistics', async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');

    // Student statistics
    const totalStudentsResult = await db
      .select({ count: sql`count(*)` })
      .from(students)
      .where(eq(students.status, 'ACTIVE'));

    const presentStudentsResult = await db
      .select({ count: sql`count(*)` })
      .from(attendance)
      .where(
        and(
          sql`DATE(${attendance.date}) = ${today}`,
          sql`${attendance.status} IN ('PRESENT', 'LATE')`
        )
      );

    const attendedStudentIds = await db
      .select({ studentId: attendance.studentId })
      .from(attendance)
      .where(sql`DATE(${attendance.date}) = ${today}`);

    const attendedIds = attendedStudentIds.map(row => row.studentId);

    const absentStudentsResult = await db
      .select({ count: sql`count(*)` })
      .from(students)
      .where(
        and(
          eq(students.status, 'ACTIVE'),
          sql`${students.id} NOT IN (${attendedIds.length > 0 ? attendedIds : [0]})`
        )
      );

    const lateStudentsResult = await db
      .select({ count: sql`count(*)` })
      .from(attendance)
      .where(
        and(
          sql`DATE(${attendance.date}) = ${today}`,
          eq(attendance.isLate, true)
        )
      );

    // Staff statistics
    const totalStaffResult = await db
      .select({ count: sql`count(*)` })
      .from(staff)
      .where(eq(staff.status, 'ACTIVE'));

    const presentStaffResult = await db
      .select({ count: sql`count(*)` })
      .from(staffAttendance)
      .where(
        and(
          sql`DATE(${staffAttendance.date}) = ${today}`,
          eq(staffAttendance.status, 'PRESENT')
        )
      );

    const attendedStaffIds = await db
      .select({ staffId: staffAttendance.staffId })
      .from(staffAttendance)
      .where(sql`DATE(${staffAttendance.date}) = ${today}`);

    const attendedStaffIdsList = attendedStaffIds.map(row => row.staffId);

    const absentStaffResult = await db
      .select({ count: sql`count(*)` })
      .from(staff)
      .where(
        and(
          eq(staff.status, 'ACTIVE'),
          sql`${staff.id} NOT IN (${attendedStaffIdsList.length > 0 ? attendedStaffIdsList : [0]})`
        )
      );

    // Calculate attendance rates
    const totalStudents = totalStudentsResult[0]?.count || 0;
    const presentStudents = presentStudentsResult[0]?.count || 0;
    const studentAttendanceRate = totalStudents > 0 
      ? Math.round((presentStudents / totalStudents) * 100) 
      : 0;

    const totalStaff = totalStaffResult[0]?.count || 0;
    const presentStaff = presentStaffResult[0]?.count || 0;
    const staffAttendanceRate = totalStaff > 0 
      ? Math.round((presentStaff / totalStaff) * 100) 
      : 0;

    res.json({
      students: {
        total: totalStudents,
        present: presentStudents,
        absent: absentStudentsResult[0]?.count || 0,
        late: lateStudentsResult[0]?.count || 0
      },
      staff: {
        total: totalStaff,
        present: presentStaff,
        absent: absentStaffResult[0]?.count || 0
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
    const studentActivity = await db
      .select({
        id: attendance.id,
        arrivalTime: attendance.arrivalTime,
        status: attendance.status,
        firstName: students.firstName,
        lastName: students.lastName,
        grade: classes.grade,
        section: classes.section,
        personType: sql`'STUDENT'`
      })
      .from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(sql`DATE(${attendance.date}) = CURRENT_DATE`)
      .orderBy(desc(attendance.createdAt));

    // Get recent staff attendance
    const staffActivity = await db
      .select({
        id: staffAttendance.id,
        arrivalTime: staffAttendance.arrivalTime,
        status: staffAttendance.status,
        firstName: staff.firstName,
        lastName: staff.lastName,
        department: staff.department,
        position: staff.position,
        personType: sql`'STAFF'`
      })
      .from(staffAttendance)
      .innerJoin(staff, eq(staffAttendance.staffId, staff.id))
      .where(sql`DATE(${staffAttendance.date}) = CURRENT_DATE`)
      .orderBy(desc(staffAttendance.createdAt));

    // Combine and sort by time
    const allActivity = [
      ...studentActivity.map(a => ({
        ...a,
        event: a.status === 'DEPARTED' ? 'DEPARTURE' : 'ARRIVAL',
        class: a.grade ? `${a.grade} ${a.section}` : null,
        department: null,
        position: null
      })),
      ...staffActivity.map(a => ({
        ...a,
        event: a.status === 'DEPARTED' ? 'DEPARTURE' : 'PRESENT',
        class: null,
        department: a.department,
        position: a.position
      }))
    ].sort((a, b) => new Date(b.arrivalTime) - new Date(a.arrivalTime))
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

    const result = await db
      .select({
        id: classes.id,
        grade: classes.grade,
        section: classes.section,
        capacity: classes.capacity
      })
      .from(classes)
      .orderBy(classes.grade, classes.section);

    const classAttendance = await Promise.all(
      result.map(async (c) => {
        const totalStudentsResult = await db
          .select({ count: sql`count(*)` })
          .from(students)
          .where(
            and(
              eq(students.classId, c.id),
              eq(students.status, 'ACTIVE')
            )
          );

        const presentResult = await db
          .select({ count: sql`count(*)` })
          .from(attendance)
          .innerJoin(students, eq(attendance.studentId, students.id))
          .where(
            and(
              eq(students.classId, c.id),
              sql`DATE(${attendance.date}) = ${today}`,
              sql`${attendance.status} IN ('PRESENT', 'LATE')`
            )
          );

        const lateResult = await db
          .select({ count: sql`count(*)` })
          .from(attendance)
          .innerJoin(students, eq(attendance.studentId, students.id))
          .where(
            and(
              eq(students.classId, c.id),
              sql`DATE(${attendance.date}) = ${today}`,
              eq(attendance.isLate, true)
            )
          );

        const totalStudents = totalStudentsResult[0].count;
        const present = presentResult[0].count;
        const late = lateResult[0].count;
        const absent = totalStudents - present;

        return {
          ...c,
          total_students: totalStudents,
          present,
          late,
          absent,
          attendance_rate: totalStudents > 0 
            ? ((present / totalStudents) * 100).toFixed(1)
            : '0.0'
        };
      })
    );

    res.json({
      date: today,
      classes: classAttendance
    });
  } catch (error) {
    logger.error('Error fetching class attendance', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
