const express = require('express');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all students with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, classId, status } = req.query;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT s.*, c.grade, c.section, p.first_name as parent_first_name, 
             p.last_name as parent_last_name, p.phone as parent_phone, 
             p.whatsapp_number as parent_whatsapp
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN parents p ON s.parent_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      queryText += ` AND (s.first_name ILIKE $${paramCount} OR s.last_name ILIKE $${paramCount} OR s.student_id ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (classId) {
      queryText += ` AND s.class_id = $${paramCount}`;
      params.push(classId);
      paramCount++;
    }

    if (status) {
      queryText += ` AND s.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ` ORDER BY s.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM students s WHERE 1=1`;
    const countParams = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (s.first_name ILIKE $${countParamCount} OR s.last_name ILIKE $${countParamCount} OR s.student_id ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (classId) {
      countQuery += ` AND s.class_id = $${countParamCount}`;
      countParams.push(classId);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND s.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      students: result.rows,
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
    const result = await query(
      `SELECT s.*, c.grade, c.section, p.first_name as parent_first_name, 
              p.last_name as parent_last_name, p.phone as parent_phone, 
              p.whatsapp_number as parent_whatsapp, p.email as parent_email
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);
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
      class_id, parent_id, rfid_uid, address, status
    } = req.body;

    const result = await query(
      `INSERT INTO students (student_id, first_name, last_name, gender, date_of_birth, 
                            class_id, parent_id, rfid_uid, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [student_id, first_name, last_name, gender, date_of_birth, 
       class_id, parent_id, rfid_uid, address, status || 'ACTIVE']
    );

    logger.info('Student created', { studentId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
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
      class_id, parent_id, rfid_uid, address, status
    } = req.body;

    const result = await query(
      `UPDATE students 
       SET first_name = $1, last_name = $2, gender = $3, date_of_birth = $4,
           class_id = $5, parent_id = $6, rfid_uid = $7, address = $8, status = $9
       WHERE id = $10
       RETURNING *`,
      [first_name, last_name, gender, date_of_birth, 
       class_id, parent_id, rfid_uid, address, status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    logger.info('Student updated', { studentId: req.params.id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating student', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM students WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    logger.info('Student deleted', { studentId: req.params.id });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    logger.error('Error deleting student', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
