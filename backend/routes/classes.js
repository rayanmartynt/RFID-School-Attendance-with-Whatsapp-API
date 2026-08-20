import express from 'express';
import { db } from '../db/index.js';
import { classes, academicYears, students, parents } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all classes
router.get('/', async (req, res) => {
  try {
    const results = await db
      .select({
        class: classes,
        academicYear: academicYears.name,
        studentCount: sql`(SELECT COUNT(*) FROM students WHERE class_id = ${classes.id})`
      })
      .from(classes)
      .leftJoin(academicYears, eq(classes.academicYearId, academicYears.id))
      .orderBy(classes.grade, classes.section);

    const formattedResults = results.map(row => ({
      ...row.class,
      academic_year: row.academicYear,
      student_count: row.studentCount
    }));

    res.json(formattedResults);
  } catch (error) {
    logger.error('Error fetching classes', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get class by ID with students
router.get('/:id', async (req, res) => {
  try {
    const classResult = await db
      .select({
        class: classes,
        academicYear: academicYears.name
      })
      .from(classes)
      .leftJoin(academicYears, eq(classes.academicYearId, academicYears.id))
      .where(eq(classes.id, parseInt(req.params.id)))
      .limit(1);

    if (classResult.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const studentsResult = await db
      .select({
        student: students,
        parent: parents
      })
      .from(students)
      .leftJoin(parents, eq(students.parentId, parents.id))
      .where(and(eq(students.classId, parseInt(req.params.id)), eq(students.status, 'ACTIVE')))
      .orderBy(students.lastName, students.firstName);

    const formattedStudents = studentsResult.map(row => ({
      ...row.student,
      parent_first_name: row.parent?.firstName,
      parent_last_name: row.parent?.lastName,
      parent_phone: row.parent?.phone,
      parent_whatsapp: row.parent?.phone
    }));

    res.json({
      class: {
        ...classResult[0].class,
        academic_year: classResult[0].academicYear
      },
      students: formattedStudents
    });
  } catch (error) {
    logger.error('Error fetching class', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new class
router.post('/', async (req, res) => {
  try {
    const { grade, section, academic_year_id, capacity } = req.body;

    const result = await db
      .insert(classes)
      .values({
        grade,
        section,
        academicYearId: academic_year_id,
        capacity: capacity || 40
      })
      .returning();

    logger.info('Class created', { classId: result[0].id });
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error creating class', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update class
router.put('/:id', async (req, res) => {
  try {
    const { grade, section, academic_year_id, capacity } = req.body;

    const result = await db
      .update(classes)
      .set({
        grade,
        section,
        academicYearId: academic_year_id,
        capacity,
        updatedAt: new Date()
      })
      .where(eq(classes.id, parseInt(req.params.id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    logger.info('Class updated', { classId: req.params.id });
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating class', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete class
router.delete('/:id', async (req, res) => {
  try {
    // Check if class has students
    const studentCheck = await db
      .select({ count: sql`count(*)` })
      .from(students)
      .where(eq(students.classId, parseInt(req.params.id)));

    if (studentCheck[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete class with enrolled students' 
      });
    }

    const result = await db
      .delete(classes)
      .where(eq(classes.id, parseInt(req.params.id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    logger.info('Class deleted', { classId: req.params.id });
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    logger.error('Error deleting class', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
