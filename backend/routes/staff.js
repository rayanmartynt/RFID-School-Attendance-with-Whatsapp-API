const express = require('express');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all staff with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department, status } = req.query;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT * FROM staff
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      queryText += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR staff_id ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (department) {
      queryText += ` AND department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    if (status) {
      queryText += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM staff WHERE 1=1`;
    const countParams = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (first_name ILIKE $${countParamCount} OR last_name ILIKE $${countParamCount} OR staff_id ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (department) {
      countQuery += ` AND department = $${countParamCount}`;
      countParams.push(department);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      staff: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching staff', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get staff by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM staff WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching staff', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new staff
router.post('/', async (req, res) => {
  try {
    const {
      staff_id, first_name, last_name, gender, date_of_birth,
      position, department, phone_number, email, rfid_uid,
      employment_type, date_joined, status
    } = req.body;

    const result = await query(
      `INSERT INTO staff (staff_id, first_name, last_name, gender, date_of_birth, 
                         position, department, phone_number, email, rfid_uid,
                         employment_type, date_joined, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [staff_id, first_name, last_name, gender, date_of_birth,
       position, department, phone_number, email, rfid_uid,
       employment_type, date_joined, status || 'ACTIVE']
    );

    logger.info('Staff created', { staffId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating staff', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update staff
router.put('/:id', async (req, res) => {
  try {
    const {
      first_name, last_name, gender, date_of_birth,
      position, department, phone_number, email, rfid_uid,
      employment_type, status
    } = req.body;

    const result = await query(
      `UPDATE staff 
       SET first_name = $1, last_name = $2, gender = $3, date_of_birth = $4,
           position = $5, department = $6, phone_number = $7, email = $8,
           rfid_uid = $9, employment_type = $10, status = $11
       WHERE id = $12
       RETURNING *`,
      [first_name, last_name, gender, date_of_birth,
       position, department, phone_number, email, rfid_uid,
       employment_type, status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    logger.info('Staff updated', { staffId: req.params.id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating staff', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete staff
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM staff WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    logger.info('Staff deleted', { staffId: req.params.id });
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    logger.error('Error deleting staff', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
