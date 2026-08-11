const express = require('express');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all parents
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT p.*, 
             (SELECT COUNT(*) FROM students WHERE parent_id = p.id) as student_count
      FROM parents p
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      queryText += ` AND (p.first_name ILIKE $${paramCount} OR p.last_name ILIKE $${paramCount} OR p.phone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM parents WHERE 1=1`;
    const countParams = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (first_name ILIKE $${countParamCount} OR last_name ILIKE $${countParamCount} OR phone ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      parents: result.rows,
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
    const parentResult = await query('SELECT * FROM parents WHERE id = $1', [req.params.id]);

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const studentsResult = await query(
      `SELECT s.*, c.grade, c.section 
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.parent_id = $1`,
      [req.params.id]
    );

    res.json({
      parent: parentResult.rows[0],
      students: studentsResult.rows
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
      first_name, last_name, phone, whatsapp_number,
      email, address, notifications_enabled
    } = req.body;

    const result = await query(
      `INSERT INTO parents (first_name, last_name, phone, whatsapp_number, 
                           email, address, notifications_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [first_name, last_name, phone, whatsapp_number || phone,
       email, address, notifications_enabled !== undefined ? notifications_enabled : true]
    );

    logger.info('Parent created', { parentId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating parent', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update parent
router.put('/:id', async (req, res) => {
  try {
    const {
      first_name, last_name, phone, whatsapp_number,
      email, address, notifications_enabled
    } = req.body;

    const result = await query(
      `UPDATE parents 
       SET first_name = $1, last_name = $2, phone = $3, whatsapp_number = $4,
           email = $5, address = $6, notifications_enabled = $7
       WHERE id = $8
       RETURNING *`,
      [first_name, last_name, phone, whatsapp_number || phone,
       email, address, notifications_enabled, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    logger.info('Parent updated', { parentId: req.params.id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating parent', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete parent
router.delete('/:id', async (req, res) => {
  try {
    // Check if parent has associated students
    const studentCheck = await query(
      'SELECT COUNT(*) FROM students WHERE parent_id = $1',
      [req.params.id]
    );

    if (parseInt(studentCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete parent with associated students' 
      });
    }

    const result = await query(
      'DELETE FROM parents WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    logger.info('Parent deleted', { parentId: req.params.id });
    res.json({ message: 'Parent deleted successfully' });
  } catch (error) {
    logger.error('Error deleting parent', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
