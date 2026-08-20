import express from 'express';
import { db } from '../db/index.js';
import { rfidCards, students, staff, attendance, staffAttendance, devices, academicYears } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import moment from 'moment';

const router = express.Router();

// RFID Scan endpoint for Arduino
router.post('/scan', async (req, res) => {
  try {
    const { rfid_uid, device_id } = req.body;

    if (!rfid_uid) {
      return res.status(400).json({ error: 'rfid_uid is required' });
    }

    // Find RFID card
    const rfidResult = await db
      .select()
      .from(rfidCards)
      .where(eq(rfidCards.rfidUid, rfid_uid))
      .limit(1);

    if (rfidResult.length === 0) {
      return res.status(404).json({ error: 'RFID card not registered' });
    }

    const card = rfidResult[0];

    if (card.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'RFID card is not active' });
    }

    // Update last used time
    await db
      .update(rfidCards)
      .set({ lastUsed: new Date(), updatedAt: new Date() })
      .where(eq(rfidCards.id, card.id));

    // Get person details and record attendance
    if (card.personType === 'STUDENT') {
      const studentResult = await db
        .select()
        .from(students)
        .where(eq(students.id, card.personId))
        .limit(1);

      if (studentResult.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const student = studentResult[0];

      if (student.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'Student is not active' });
      }

      // Check for existing attendance today
      const today = moment().format('YYYY-MM-DD');
      const existingAttendance = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.studentId, student.id),
            sql`DATE(${attendance.date}) = ${today}`
          )
        )
        .limit(1);

      const schoolStartTime = process.env.SCHOOL_TIME_START || '07:50';
      const currentTime = moment().format('HH:mm');
      const isLate = currentTime > schoolStartTime;

      if (existingAttendance.length > 0) {
        // Update departure time
        await db
          .update(attendance)
          .set({
            departureTime: currentTime,
            updatedAt: new Date()
          })
          .where(eq(attendance.id, existingAttendance[0].id));

        logger.info('Student departure recorded', { studentId: student.id, rfidUid });
        return res.json({
          success: true,
          message: 'Departure recorded',
          student: {
            id: student.id,
            studentId: student.studentId,
            firstName: student.firstName,
            lastName: student.lastName
          },
          attendance: {
            ...existingAttendance[0],
            departureTime: currentTime
          }
        });
      } else {
        // Create new attendance record
        const attendanceResult = await db
          .insert(attendance)
          .values({
            studentId: student.id,
            deviceId: device_id,
            date: new Date(),
            arrivalTime: currentTime,
            status: 'PRESENT',
            isLate
          })
          .returning();

        logger.info('Student arrival recorded', { studentId: student.id, rfidUid, isLate });
        return res.json({
          success: true,
          message: isLate ? 'Late arrival recorded' : 'Arrival recorded',
          student: {
            id: student.id,
            studentId: student.studentId,
            firstName: student.firstName,
            lastName: student.lastName
          },
          attendance: attendanceResult[0]
        });
      }
    } else if (card.personType === 'STAFF') {
      const staffResult = await db
        .select()
        .from(staff)
        .where(eq(staff.id, card.personId))
        .limit(1);

      if (staffResult.length === 0) {
        return res.status(404).json({ error: 'Staff not found' });
      }

      const staffMember = staffResult[0];

      if (staffMember.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'Staff is not active' });
      }

      // Check for existing attendance today
      const today = moment().format('YYYY-MM-DD');
      const existingAttendance = await db
        .select()
        .from(staffAttendance)
        .where(
          and(
            eq(staffAttendance.staffId, staffMember.id),
            sql`DATE(${staffAttendance.date}) = ${today}`
          )
        )
        .limit(1);

      const currentTime = moment().format('HH:mm');

      if (existingAttendance.length > 0) {
        // Update departure time
        await db
          .update(staffAttendance)
          .set({
            departureTime: currentTime,
            updatedAt: new Date()
          })
          .where(eq(staffAttendance.id, existingAttendance[0].id));

        logger.info('Staff departure recorded', { staffId: staffMember.id, rfidUid });
        return res.json({
          success: true,
          message: 'Departure recorded',
          staff: {
            id: staffMember.id,
            staffId: staffMember.staffId,
            firstName: staffMember.firstName,
            lastName: staffMember.lastName
          },
          attendance: {
            ...existingAttendance[0],
            departureTime: currentTime
          }
        });
      } else {
        // Create new attendance record
        const attendanceResult = await db
          .insert(staffAttendance)
          .values({
            staffId: staffMember.id,
            deviceId: device_id,
            date: new Date(),
            arrivalTime: currentTime,
            status: 'PRESENT'
          })
          .returning();

        logger.info('Staff arrival recorded', { staffId: staffMember.id, rfidUid });
        return res.json({
          success: true,
          message: 'Arrival recorded',
          staff: {
            id: staffMember.id,
            staffId: staffMember.staffId,
            firstName: staffMember.firstName,
            lastName: staffMember.lastName
          },
          attendance: attendanceResult[0]
        });
      }
    }

    res.status(400).json({ error: 'Invalid person type' });
  } catch (error) {
    logger.error('RFID scan error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register RFID card
router.post('/register', async (req, res) => {
  try {
    const { rfidUid, personType, personId, deviceId } = req.body;

    if (!rfidUid || !personType || !personId) {
      return res.status(400).json({ error: 'rfidUid, personType, and personId are required' });
    }

    // Check if RFID already exists
    const existingRfid = await db
      .select()
      .from(rfidCards)
      .where(eq(rfidCards.rfidUid, rfidUid))
      .limit(1);

    if (existingRfid.length > 0) {
      return res.status(409).json({ error: 'RFID card already registered' });
    }

    // Register the card
    const result = await db
      .insert(rfidCards)
      .values({
        rfidUid,
        personType,
        personId,
        status: 'ACTIVE',
        deviceId
      })
      .returning();

    logger.info('RFID card registered', { rfidUid, personType, personId });
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error registering RFID card', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all RFID cards
router.get('/', async (req, res) => {
  try {
    const { personType, status } = req.query;

    let query = db
      .select()
      .from(rfidCards)
      .orderBy(desc(rfidCards.createdAt));

    if (personType) {
      query = query.where(eq(rfidCards.personType, personType));
    }

    if (status) {
      query = query.where(eq(rfidCards.status, status));
    }

    const results = await query;

    // Enrich with person details
    const enrichedResults = await Promise.all(results.map(async (card) => {
      let personDetails = null;
      let personName = '';
      let personIdCode = '';

      if (card.personType === 'STUDENT') {
        const studentResult = await db
          .select()
          .from(students)
          .where(eq(students.id, card.personId))
          .limit(1);
        if (studentResult.length > 0) {
          personDetails = studentResult[0];
          personName = `${studentResult[0].firstName} ${studentResult[0].lastName}`;
          personIdCode = studentResult[0].studentId;
        }
      } else if (card.personType === 'STAFF') {
        const staffResult = await db
          .select()
          .from(staff)
          .where(eq(staff.id, card.personId))
          .limit(1);
        if (staffResult.length > 0) {
          personDetails = staffResult[0];
          personName = `${staffResult[0].firstName} ${staffResult[0].lastName}`;
          personIdCode = staffResult[0].staffId;
        }
      }

      return {
        ...card,
        personName,
        personIdCode,
        person: personDetails
      };
    }));

    res.json(enrichedResults);
  } catch (error) {
    logger.error('Error fetching RFID cards', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get RFID card by UID
router.get('/:uid', async (req, res) => {
  try {
    const result = await db
      .select()
      .from(rfidCards)
      .where(eq(rfidCards.rfidUid, req.params.uid))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: 'RFID card not found' });
    }

    const card = result[0];
    let personDetails = null;

    if (card.personType === 'STUDENT') {
      const studentResult = await db
        .select()
        .from(students)
        .where(eq(students.id, card.personId))
        .limit(1);
      if (studentResult.length > 0) {
        personDetails = studentResult[0];
      }
    } else if (card.personType === 'STAFF') {
      const staffResult = await db
        .select()
        .from(staff)
        .where(eq(staff.id, card.personId))
        .limit(1);
      if (staffResult.length > 0) {
        personDetails = staffResult[0];
      }
    }

    res.json({
      card,
      person: personDetails
    });
  } catch (error) {
    logger.error('Error fetching RFID card', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update RFID card status
router.put('/:uid/status', async (req, res) => {
  try {
    const { status } = req.body;

    const result = await db
      .update(rfidCards)
      .set({ status, updatedAt: new Date() })
      .where(eq(rfidCards.rfidUid, req.params.uid))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'RFID card not found' });
    }

    logger.info('RFID card status updated', { uid: req.params.uid, status });
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating RFID card status', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Replace RFID card
router.put('/:uid/replace', async (req, res) => {
  try {
    const { newRfidUid } = req.body;

    if (!newRfidUid) {
      return res.status(400).json({ error: 'newRfidUid is required' });
    }

    // Get existing card
    const existingCardResult = await db
      .select()
      .from(rfidCards)
      .where(eq(rfidCards.rfidUid, req.params.uid))
      .limit(1);

    if (existingCardResult.length === 0) {
      return res.status(404).json({ error: 'RFID card not found' });
    }

    const card = existingCardResult[0];

    // Mark old card as replaced
    await db
      .update(rfidCards)
      .set({ status: 'REPLACED', updatedAt: new Date() })
      .where(eq(rfidCards.rfidUid, req.params.uid));

    // Register new card
    const newCard = await db
      .insert(rfidCards)
      .values({
        rfidUid: newRfidUid,
        personType: card.personType,
        personId: card.personId,
        status: 'ACTIVE',
        deviceId: card.deviceId
      })
      .returning();

    logger.info('RFID card replaced', { oldUid: req.params.uid, newUid: newRfidUid });
    res.json(newCard[0]);
  } catch (error) {
    logger.error('Error replacing RFID card', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete RFID card
router.delete('/:uid', async (req, res) => {
  try {
    const result = await db
      .delete(rfidCards)
      .where(eq(rfidCards.rfidUid, req.params.uid))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'RFID card not found' });
    }

    logger.info('RFID card deleted', { uid: req.params.uid });
    res.json({ message: 'RFID card deleted successfully' });
  } catch (error) {
    logger.error('Error deleting RFID card', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
