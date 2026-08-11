const express = require('express');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get notification settings for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE student_id = $1',
      [req.params.studentId]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching notification settings', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update notification settings
router.put('/student/:studentId', async (req, res) => {
  try {
    const { notificationType, enabled } = req.body;

    const result = await query(
      `INSERT INTO notifications (student_id, parent_id, notification_type, enabled)
       VALUES ($1, (SELECT parent_id FROM students WHERE id = $1), $2, $3)
       ON CONFLICT (student_id, parent_id, notification_type)
       DO UPDATE SET enabled = $3
       RETURNING *`,
      [req.params.studentId, notificationType, enabled]
    );

    logger.info('Notification settings updated', { 
      studentId: req.params.studentId, 
      notificationType, 
      enabled 
    });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating notification settings', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notification logs
router.get('/logs', async (req, res) => {
  try {
    const { studentId, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT nl.*, s.first_name as student_first_name, s.last_name as student_last_name,
             p.first_name as parent_first_name, p.last_name as parent_last_name
      FROM notification_logs nl
      LEFT JOIN students s ON nl.student_id = s.id
      LEFT JOIN parents p ON nl.parent_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (studentId) {
      queryText += ` AND nl.student_id = $${paramCount}`;
      params.push(studentId);
      paramCount++;
    }

    if (status) {
      queryText += ` AND nl.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ` ORDER BY nl.sent_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json({
      logs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching notification logs', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notification statistics
router.get('/statistics', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const totalSentResult = await query(
      `SELECT COUNT(*) as count FROM notification_logs 
       WHERE DATE(sent_at) = $1 AND status = $2`,
      [today, 'SENT']
    );

    const totalFailedResult = await query(
      `SELECT COUNT(*) as count FROM notification_logs 
       WHERE DATE(sent_at) = $1 AND status = $2`,
      [today, 'FAILED']
    );

    const byTypeResult = await query(
      `SELECT notification_type, COUNT(*) as count 
       FROM notification_logs 
       WHERE DATE(sent_at) = $1
       GROUP BY notification_type`,
      [today]
    );

    res.json({
      date: today,
      totalSent: parseInt(totalSentResult.rows[0].count),
      totalFailed: parseInt(totalFailedResult.rows[0].count),
      byType: byTypeResult.rows
    });
  } catch (error) {
    logger.error('Error fetching notification statistics', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
