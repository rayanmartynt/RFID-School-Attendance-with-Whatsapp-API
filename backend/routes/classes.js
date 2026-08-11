const express = require('express');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all classes
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, ay.name as academic_year,
              (SELECT COUNT(*) FROM students WHERE class_id = c.id) as student_count
       FROM classes c
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       ORDER BY c.grade, c.section`
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching classes', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get class by ID with students
router.get('/:id', async (req, res) => {
  try {
    const classResult = await query(
      `SELECT c.*, ay.name as academic_year
       FROM classes c
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const studentsResult = await query(
      `SELECT s.*, p.first_name as parent_first_name, p.last_name as parent_last_name,
              p.phone as parent_phone, p.whatsapp_number as parent_whatsapp
       FROM students s
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE s.class_id = $1 AND s.status = 'ACTIVE'
       ORDER BY s.last_name, s.first_name`,
      [req.params.id]
    );

    res.json({
      class: classResult.rows[0],
      students: studentsResult.rows
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

    const result = await query(
      `INSERT INTO classes (grade, section, academic_year_id, capacity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [grade, section, academic_year_id, capacity || 40]
    );

    logger.info('Class created', { classId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating class', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update class
router.put('/:id', async (req, res) => {
  try {
    const { grade, section, academic_year_id, capacity } = req.body;

    const result = await query(
      `UPDATE classes 
       SET grade = $1, section = $2, academic_year_id = $3, capacity = $4
       WHERE id = $5
       RETURNING *`,
      [grade, section, academic_year_id, capacity, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    logger.info('Class updated', { classId: req.params.id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating class', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete class
router.delete('/:id', async (req, res) => {
  try {
    // Check if class has students
    const studentCheck = await query(
      'SELECT COUNT(*) FROM students WHERE class_id = $1',
      [req.params.id]
    );

    if (parseInt(studentCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete class with enrolled students' 
      });
    }

    const result = await query(
      'DELETE FROM classes WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    logger.info('Class deleted', { classId: req.params.id });
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    logger.error('Error deleting class', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
