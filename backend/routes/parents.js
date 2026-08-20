import express from 'express';
import { db } from '../db/index.js';
import { parents, students, classes } from '../db/schema.js';
import { eq, desc, like, or, sql, and } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all parents
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let query = db
      .select({
        parent: parents,
        studentCount: sql`(SELECT COUNT(*) FROM students WHERE parent_id = ${parents.id})`
      })
      .from(parents)
      .orderBy(desc(parents.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply filters
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(parents.firstName, `%${search}%`),
          like(parents.lastName, `%${search}%`),
          like(parents.phone, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(...conditions);
    }

    const results = await query;

    // Get total count
    let countQuery = db.select({ count: sql`count(*)` }).from(parents);
    if (conditions.length > 0) {
      countQuery = countQuery.where(...conditions);
    }
    const countResult = await countQuery;
    const total = countResult[0].count;

    const formattedResults = results.map(row => ({
      ...row.parent,
      student_count: row.studentCount
    }));

    res.json({
      parents: formattedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching parents', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get parent by ID with associated students
router.get('/:id', async (req, res) => {
  try {
    const parentResult = await db
      .select()
      .from(parents)
      .where(eq(parents.id, parseInt(req.params.id)))
      .limit(1);

    if (parentResult.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const studentsResult = await db
      .select({
        student: students,
        class: classes
      })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(eq(students.parentId, parseInt(req.params.id)));

    const formattedStudents = studentsResult.map(row => ({
      ...row.student,
      grade: row.class?.grade,
      section: row.class?.section
    }));

    res.json({
      parent: parentResult[0],
      students: formattedStudents
    });
  } catch (error) {
    logger.error('Error fetching parent', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new parent
router.post('/', async (req, res) => {
  try {
    const {
      first_name, last_name, phone, email, address, notification_enabled
    } = req.body;

    const result = await db
      .insert(parents)
      .values({
        firstName: first_name,
        lastName: last_name,
        phone,
        email,
        address,
        notificationEnabled: notification_enabled !== undefined ? notification_enabled : true
      })
      .returning();

    logger.info('Parent created', { parentId: result[0].id });
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error creating parent', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update parent
router.put('/:id', async (req, res) => {
  try {
    const {
      first_name, last_name, phone, email, address, notification_enabled
    } = req.body;

    const result = await db
      .update(parents)
      .set({
        firstName: first_name,
        lastName: last_name,
        phone,
        email,
        address,
        notificationEnabled: notification_enabled,
        updatedAt: new Date()
      })
      .where(eq(parents.id, parseInt(req.params.id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    logger.info('Parent updated', { parentId: req.params.id });
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating parent', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete parent
router.delete('/:id', async (req, res) => {
  try {
    // Check if parent has associated students
    const studentCheck = await db
      .select({ count: sql`count(*)` })
      .from(students)
      .where(eq(students.parentId, parseInt(req.params.id)));

    if (studentCheck[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete parent with associated students' 
      });
    }

    const result = await db
      .delete(parents)
      .where(eq(parents.id, parseInt(req.params.id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    logger.info('Parent deleted', { parentId: req.params.id });
    res.json({ message: 'Parent deleted successfully' });
  } catch (error) {
    logger.error('Error deleting parent', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
