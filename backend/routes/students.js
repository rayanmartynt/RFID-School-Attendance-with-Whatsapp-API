import express from 'express';
import { db } from '../db/index.js';
import { students, classes, parents } from '../db/schema.js';
import { eq, desc, like, or, sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all students with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, classId, status } = req.query;
    const offset = (page - 1) * limit;

    let query = db
      .select({
        student: students,
        class: classes,
        parent: parents
      })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .leftJoin(parents, eq(students.parentId, parents.id))
      .orderBy(desc(students.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply filters
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(students.firstName, `%${search}%`),
          like(students.lastName, `%${search}%`),
          like(students.studentId, `%${search}%`)
        )
      );
    }
    if (classId) {
      conditions.push(eq(students.classId, parseInt(classId)));
    }
    if (status) {
      conditions.push(eq(students.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(...conditions);
    }

    const results = await query;

    // Get total count
    let countQuery = db.select({ count: sql`count(*)` }).from(students);
    if (conditions.length > 0) {
      countQuery = countQuery.where(...conditions);
    }
    const countResult = await countQuery;
    const total = countResult[0].count;

    // Format response
    const formattedResults = results.map(row => ({
      ...row.student,
      grade: row.class?.grade,
      section: row.class?.section,
      parent_first_name: row.parent?.firstName,
      parent_last_name: row.parent?.lastName,
      parent_phone: row.parent?.phone,
      parent_whatsapp: row.parent?.phone
    }));

    res.json({
      students: formattedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching students', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db
      .select({
        student: students,
        class: classes,
        parent: parents
      })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .leftJoin(parents, eq(students.parentId, parents.id))
      .where(eq(students.id, parseInt(req.params.id)))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const row = result[0];
    res.json({
      ...row.student,
      grade: row.class?.grade,
      section: row.class?.section,
      parent_first_name: row.parent?.firstName,
      parent_last_name: row.parent?.lastName,
      parent_phone: row.parent?.phone,
      parent_whatsapp: row.parent?.phone,
      parent_email: row.parent?.email
    });
  } catch (error) {
    logger.error('Error fetching student', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new student
router.post('/', async (req, res) => {
  try {
    const {
      student_id, first_name, last_name, gender, date_of_birth,
      class_id, parent_id, address, status, phone
    } = req.body;

    const result = await db
      .insert(students)
      .values({
        studentId: student_id,
        firstName: first_name,
        lastName: last_name,
        gender,
        dateOfBirth: date_of_birth,
        classId: class_id,
        parentId: parent_id,
        address,
        status: status || 'ACTIVE',
        phone
      })
      .returning();

    logger.info('Student created', { studentId: result[0].id });
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error creating student', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const {
      first_name, last_name, gender, date_of_birth,
      class_id, parent_id, address, status, phone
    } = req.body;

    const result = await db
      .update(students)
      .set({
        firstName: first_name,
        lastName: last_name,
        gender,
        dateOfBirth: date_of_birth,
        classId: class_id,
        parentId: parent_id,
        address,
        status,
        phone,
        updatedAt: new Date()
      })
      .where(eq(students.id, parseInt(req.params.id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    logger.info('Student updated', { studentId: req.params.id });
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating student', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const result = await db
      .delete(students)
      .where(eq(students.id, parseInt(req.params.id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    logger.info('Student deleted', { studentId: req.params.id });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    logger.error('Error deleting student', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
