const express = require('express');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all devices
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM devices ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching devices', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get device by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM devices WHERE device_id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching device', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new device
router.post('/', async (req, res) => {
  try {
    const { device_id, device_name, location, device_type, api_key } = req.body;

    const result = await query(
      `INSERT INTO devices (device_id, device_name, location, device_type, api_key, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [device_id, device_name, location, device_type, api_key, 'ONLINE']
    );

    logger.info('Device created', { deviceId: result.rows[0].device_id });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating device', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update device
router.put('/:id', async (req, res) => {
  try {
    const { device_name, location, device_type, status } = req.body;

    const result = await query(
      `UPDATE devices 
       SET device_name = $1, location = $2, device_type = $3, status = $4
       WHERE device_id = $5
       RETURNING *`,
      [device_name, location, device_type, status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    logger.info('Device updated', { deviceId: req.params.id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating device', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update device status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const result = await query(
      'UPDATE devices SET status = $1 WHERE device_id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    logger.info('Device status updated', { deviceId: req.params.id, status });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating device status', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete device
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM devices WHERE device_id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    logger.info('Device deleted', { deviceId: req.params.id });
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    logger.error('Error deleting device', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
