import express from 'express';
import { db } from '../db/index.js';
import { attendance, students, classes, parents, rfidCards, devices } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import moment from 'moment';

const router = express.Router();

// Get student attendance
router.get('/', async (req, res) => {
  try {
    const { date, classId, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const queryDate = date || moment().format('YYYY-MM-DD');

    let query = db
      .select({
        attendance,
        student: students,
        class: classes,
        parent: parents
      })
      .from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .leftJoin(parents, eq(students.parentId, parents.id))
      .where(sql`DATE(${attendance.date}) = ${queryDate}`)
      .orderBy(desc(attendance.arrivalTime))
      .limit(limit)
      .offset(offset);

    // Apply filters
    const conditions = [];
    if (classId) {
      conditions.push(eq(students.classId, parseInt(classId)));
    }
    if (status) {
      conditions.push(eq(attendance.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(sql`DATE(${attendance.date}) = ${queryDate}`, ...conditions));
    }

    const results = await query;

    // Format response
    const formattedResults = results.map(row => ({
      ...row.attendance,
      student_id: row.student?.studentId,
      first_name: row.student?.firstName,
      last_name: row.student?.lastName,
      grade: row.class?.grade,
      section: row.class?.section,
      parent_first_name: row.parent?.firstName,
      parent_last_name: row.parent?.lastName,
      parent_phone: row.parent?.phone
    }));

    res.json({
      attendance: formattedResults,
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

    // Get all active students
    const allStudents = await db
      .select({
        student: students,
        class: classes,
        parent: parents
      })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .leftJoin(parents, eq(students.parentId, parents.id))
      .where(eq(students.status, 'ACTIVE'));

    // Get students with attendance on that date
    const attendedStudentIds = await db
      .select({ studentId: attendance.studentId })
      .from(attendance)
      .where(sql`DATE(${attendance.date}) = ${date}`);

    const attendedIds = attendedStudentIds.map(row => row.studentId);

    // Filter out attended students
    const absentStudents = allStudents.filter(
      row => !attendedIds.includes(row.student.id)
    );

    const formattedResults = absentStudents.map(row => ({
      student_id: row.student?.studentId,
      first_name: row.student?.firstName,
      last_name: row.student?.lastName,
      grade: row.class?.grade,
      section: row.class?.section,
      parent_first_name: row.parent?.firstName,
      parent_last_name: row.parent?.lastName,
      parent_phone: row.parent?.phone
    }));

    res.json({
      date,
      absentStudents: formattedResults
    });
  } catch (error) {
    logger.error('Error fetching absent students', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
