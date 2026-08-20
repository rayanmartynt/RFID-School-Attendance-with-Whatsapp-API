import express from 'express';
import { db } from '../db/index.js';
import { devices } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all devices
router.get('/', async (req, res) => {
  try {
    const results = await db
      .select()
      .from(devices)
      .orderBy(desc(devices.createdAt));

    res.json(results);
  } catch (error) {
    logger.error('Error fetching devices', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get device by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db
      .select()
      .from(devices)
      .where(eq(devices.deviceId, req.params.id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(result[0]);
  } catch (error) {
    logger.error('Error fetching device', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new device
router.post('/', async (req, res) => {
  try {
    const { device_id, device_name, location, device_type, api_key } = req.body;

    const result = await db
      .insert(devices)
      .values({
        deviceId: device_id,
        deviceName: device_name,
        location,
        deviceType: device_type,
        apiKey: api_key,
        status: 'ONLINE'
      })
      .returning();

    logger.info('Device created', { deviceId: result[0].deviceId });
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error creating device', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create device without auth (for setup)
router.post('/setup', async (req, res) => {
  try {
    const { device_id, device_name, location, device_type, api_key } = req.body;

    const result = await db
      .insert(devices)
      .values({
        deviceId: device_id,
        deviceName: device_name,
        location,
        deviceType: device_type,
        apiKey: api_key,
        status: 'ONLINE'
      })
      .returning();

    logger.info('Device created via setup', { deviceId: result[0].deviceId });
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error creating device via setup', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update device
router.put('/:id', async (req, res) => {
  try {
    const { device_name, location, device_type, status } = req.body;

    const result = await db
      .update(devices)
      .set({
        deviceName: device_name,
        location,
        deviceType: device_type,
        status,
        updatedAt: new Date()
      })
      .where(eq(devices.deviceId, req.params.id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    logger.info('Device updated', { deviceId: req.params.id });
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating device', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update device status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const result = await db
      .update(devices)
      .set({ status, updatedAt: new Date() })
      .where(eq(devices.deviceId, req.params.id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    logger.info('Device status updated', { deviceId: req.params.id, status });
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating device status', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete device
router.delete('/:id', async (req, res) => {
  try {
    const result = await db
      .delete(devices)
      .where(eq(devices.deviceId, req.params.id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    logger.info('Device deleted', { deviceId: req.params.id });
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    logger.error('Error deleting device', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
