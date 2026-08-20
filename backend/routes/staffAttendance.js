import express from 'express';
import { db } from '../db/index.js';
import { staffAttendance, staff } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import moment from 'moment';

const router = express.Router();

// Get staff attendance
router.get('/', async (req, res) => {
  try {
    const { date, department, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const queryDate = date || moment().format('YYYY-MM-DD');

    let query = db
      .select({
        attendance: staffAttendance,
        staff: staff
      })
      .from(staffAttendance)
      .innerJoin(staff, eq(staffAttendance.staffId, staff.id))
      .where(sql`DATE(${staffAttendance.date}) = ${queryDate}`)
      .orderBy(desc(staffAttendance.arrivalTime))
      .limit(limit)
      .offset(offset);

    // Apply filters
    const conditions = [];
    if (department) {
      conditions.push(eq(staff.department, department));
    }
    if (status) {
      conditions.push(eq(staffAttendance.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(sql`DATE(${staffAttendance.date}) = ${queryDate}`, ...conditions));
    }

    const results = await query;

    const formattedResults = results.map(row => ({
      ...row.attendance,
      staff_id: row.staff?.staffId,
      first_name: row.staff?.firstName,
      last_name: row.staff?.lastName,
      department: row.staff?.department,
      position: row.staff?.position
    }));

    res.json({
      attendance: formattedResults,
      date: queryDate,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching staff attendance', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
