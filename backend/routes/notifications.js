import express from 'express';
import { db } from '../db/index.js';
import { notifications, notificationHistory, students, parents } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get notification settings for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.studentId, parseInt(req.params.studentId)));

    res.json(result);
  } catch (error) {
    logger.error('Error fetching notification settings', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update notification settings
router.put('/student/:studentId', async (req, res) => {
  try {
    const { notificationType, enabled } = req.body;

    const studentResult = await db
      .select({ parentId: students.parentId })
      .from(students)
      .where(eq(students.id, parseInt(req.params.studentId)))
      .limit(1);

    if (studentResult.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const result = await db
      .insert(notifications)
      .values({
        studentId: parseInt(req.params.studentId),
        parentId: studentResult[0].parentId,
        notificationType,
        enabled
      })
      .onConflictDoUpdate({
        target: [notifications.studentId, notifications.parentId, notifications.notificationType],
        set: { enabled }
      })
      .returning();

    logger.info('Notification settings updated', { 
      studentId: req.params.studentId, 
      notificationType, 
      enabled 
    });
    res.json(result[0]);
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

    let query = db
      .select({
        log: notificationHistory,
        student: students,
        parent: parents
      })
      .from(notificationHistory)
      .leftJoin(students, eq(notificationHistory.studentId, students.id))
      .leftJoin(parents, eq(notificationHistory.parentId, parents.id))
      .orderBy(desc(notificationHistory.sentAt))
      .limit(limit)
      .offset(offset);

    const conditions = [];
    if (studentId) {
      conditions.push(eq(notificationHistory.studentId, parseInt(studentId)));
    }
    if (status) {
      conditions.push(eq(notificationHistory.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(...conditions);
    }

    const results = await query;

    const formattedResults = results.map(row => ({
      ...row.log,
      student_first_name: row.student?.firstName,
      student_last_name: row.student?.lastName,
      parent_first_name: row.parent?.firstName,
      parent_last_name: row.parent?.lastName
    }));

    res.json({
      logs: formattedResults,
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

    const totalSentResult = await db
      .select({ count: sql`count(*)` })
      .from(notificationHistory)
      .where(
        and(
          sql`DATE(${notificationHistory.sentAt}) = ${sql.raw(`'${today}'`)}`,
          eq(notificationHistory.status, 'SENT')
        )
      );

    const totalFailedResult = await db
      .select({ count: sql`count(*)` })
      .from(notificationHistory)
      .where(
        and(
          sql`DATE(${notificationHistory.sentAt}) = ${sql.raw(`'${today}'`)}`,
          eq(notificationHistory.status, 'FAILED')
        )
      );

    const byTypeResult = await db
      .select({
        notificationType: notificationHistory.notificationType,
        count: sql`count(*)`
      })
      .from(notificationHistory)
      .where(sql`DATE(${notificationHistory.sentAt}) = ${sql.raw(`'${today}'`)}`)
      .groupBy(notificationHistory.notificationType);

    res.json({
      date: today,
      totalSent: totalSentResult[0].count,
      totalFailed: totalFailedResult[0].count,
      byType: byTypeResult
    });
  } catch (error) {
    logger.error('Error fetching notification statistics', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
