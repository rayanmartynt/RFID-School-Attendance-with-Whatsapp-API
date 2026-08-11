const express = require('express');
const { query, getClient } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Register RFID card
router.post('/register', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { rfidUid, personType, personId, deviceId } = req.body;

    if (!rfidUid || !personType || !personId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'rfidUid, personType, and personId are required' });
    }

    // Check if RFID already exists
    const existingRfid = await client.query(
      'SELECT * FROM rfid_cards WHERE rfid_uid = $1',
      [rfidUid]
    );

    if (existingRfid.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'RFID card already registered' });
    }

    // Register the card
    const result = await client.query(
      `INSERT INTO rfid_cards (rfid_uid, person_type, person_id, status, device_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [rfidUid, personType, personId, 'ACTIVE', deviceId]
    );

    // Update the person's rfid_uid
    if (personType === 'STUDENT') {
      await client.query(
        'UPDATE students SET rfid_uid = $1 WHERE id = $2',
        [rfidUid, personId]
      );
    } else if (personType === 'STAFF') {
      await client.query(
        'UPDATE staff SET rfid_uid = $1 WHERE id = $2',
        [rfidUid, personId]
      );
    }

    await client.query('COMMIT');

    logger.info('RFID card registered', { rfidUid, personType, personId });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error registering RFID card', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get all RFID cards
router.get('/', async (req, res) => {
  try {
    const { personType, status } = req.query;

    let queryText = `
      SELECT rc.*, 
             CASE 
               WHEN rc.person_type = 'STUDENT' THEN 
                 (SELECT first_name || ' ' || last_name FROM students WHERE id = rc.person_id)
               ELSE 
                 (SELECT first_name || ' ' || last_name FROM staff WHERE id = rc.person_id)
             END as person_name,
             CASE 
               WHEN rc.person_type = 'STUDENT' THEN 
                 (SELECT student_id FROM students WHERE id = rc.person_id)
               ELSE 
                 (SELECT staff_id FROM staff WHERE id = rc.person_id)
             END as person_id_code
      FROM rfid_cards rc
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (personType) {
      queryText += ` AND rc.person_type = $${paramCount}`;
      params.push(personType);
      paramCount++;
    }

    if (status) {
      queryText += ` AND rc.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ` ORDER BY rc.created_at DESC`;

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching RFID cards', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get RFID card by UID
router.get('/:uid', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM rfid_cards WHERE rfid_uid = $1',
      [req.params.uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'RFID card not found' });
    }

    const card = result.rows[0];
    let personDetails;

    if (card.person_type === 'STUDENT') {
      personDetails = await query(
        'SELECT * FROM students WHERE id = $1',
        [card.person_id]
      );
    } else {
      personDetails = await query(
        'SELECT * FROM staff WHERE id = $1',
        [card.person_id]
      );
    }

    res.json({
      card,
      person: personDetails.rows[0] || null
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

    const result = await query(
      'UPDATE rfid_cards SET status = $1 WHERE rfid_uid = $2 RETURNING *',
      [status, req.params.uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'RFID card not found' });
    }

    logger.info('RFID card status updated', { uid: req.params.uid, status });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating RFID card status', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Replace RFID card
router.put('/:uid/replace', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { newRfidUid } = req.body;

    if (!newRfidUid) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'newRfidUid is required' });
    }

    // Get existing card
    const existingCard = await client.query(
      'SELECT * FROM rfid_cards WHERE rfid_uid = $1',
      [req.params.uid]
    );

    if (existingCard.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'RFID card not found' });
    }

    const card = existingCard.rows[0];

    // Mark old card as replaced
    await client.query(
      'UPDATE rfid_cards SET status = $1 WHERE rfid_uid = $2',
      ['REPLACED', req.params.uid]
    );

    // Register new card
    const newCard = await client.query(
      `INSERT INTO rfid_cards (rfid_uid, person_type, person_id, status, device_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [newRfidUid, card.person_type, card.person_id, 'ACTIVE', card.device_id]
    );

    // Update person's rfid_uid
    if (card.person_type === 'STUDENT') {
      await client.query(
        'UPDATE students SET rfid_uid = $1 WHERE id = $2',
        [newRfidUid, card.person_id]
      );
    } else if (card.person_type === 'STAFF') {
      await client.query(
        'UPDATE staff SET rfid_uid = $1 WHERE id = $2',
        [newRfidUid, card.person_id]
      );
    }

    await client.query('COMMIT');

    logger.info('RFID card replaced', { oldUid: req.params.uid, newUid: newRfidUid });
    res.json(newCard.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error replacing RFID card', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Delete RFID card
router.delete('/:uid', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM rfid_cards WHERE rfid_uid = $1 RETURNING *',
      [req.params.uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'RFID card not found' });
    }

    logger.info('RFID card deleted', { uid: req.params.uid });
    res.json({ message: 'RFID card deleted successfully' });
  } catch (error) {
    logger.error('Error deleting RFID card', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
