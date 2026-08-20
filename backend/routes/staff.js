import express from 'express';
import { db } from '../db/index.js';
import { staff } from '../db/schema.js';
import { eq, desc, like, or, sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all staff with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department, status } = req.query;
    const offset = (page - 1) * limit;

    let query = db
      .select()
      .from(staff)
      .orderBy(desc(staff.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply filters
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(staff.firstName, `%${search}%`),
          like(staff.lastName, `%${search}%`),
          like(staff.staffId, `%${search}%`)
        )
      );
    }
    if (department) {
      conditions.push(eq(staff.department, department));
    }
    if (status) {
      conditions.push(eq(staff.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(...conditions);
    }

    const results = await query;

    // Get total count
    let countQuery = db.select({ count: sql`count(*)` }).from(staff);
    if (conditions.length > 0) {
      countQuery = countQuery.where(...conditions);
    }
    const countResult = await countQuery;
    const total = countResult[0].count;

    res.json({
      staff: results,
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
    const result = await db
      .select()
      .from(staff)
      .where(eq(staff.id, parseInt(req.params.id)))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    res.json(result[0]);
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
      position, department, phone, email, address,
      employment_type, date_joined, status
    } = req.body;

    const result = await db
      .insert(staff)
      .values({
        staffId: staff_id,
        firstName: first_name,
        lastName: last_name,
        gender,
        dateOfBirth: date_of_birth,
        position,
        department,
        phone,
        email,
        address,
        employmentType: employment_type,
        dateJoined: date_joined,
        status: status || 'ACTIVE'
      })
      .returning();

    logger.info('Staff created', { staffId: result[0].id });
    res.status(201).json(result[0]);
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
      position, department, phone, email, address,
      employment_type, status
    } = req.body;

    const result = await db
      .update(staff)
      .set({
        firstName: first_name,
        lastName: last_name,
        gender,
        dateOfBirth: date_of_birth,
        position,
        department,
        phone,
        email,
        address,
        employmentType: employment_type,
        status,
        updatedAt: new Date()
      })
      .where(eq(staff.id, parseInt(req.params.id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    logger.info('Staff updated', { staffId: req.params.id });
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating staff', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete staff
router.delete('/:id', async (req, res) => {
  try {
    const result = await db
      .delete(staff)
      .where(eq(staff.id, parseInt(req.params.id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    logger.info('Staff deleted', { staffId: req.params.id });
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    logger.error('Error deleting staff', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
