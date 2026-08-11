const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const db = require('../config/database');
const logger = require('../utils/logger');

// Import Students from Excel
router.post('/import/students', async (req, res) => {
  try {
    const { data } = req.body; // Array of student objects from Excel

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Invalid data format. Expected array of students.' });
    }

    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      let imported = 0;
      let errors = [];

      for (const row of data) {
        try {
          // Validate required fields
          if (!row.student_id || !row.first_name || !row.last_name) {
            errors.push({ row, error: 'Missing required fields (student_id, first_name, last_name)' });
            continue;
          }

          // Check if student already exists
          const existing = await client.query(
            'SELECT id FROM students WHERE student_id = $1',
            [row.student_id]
          );

          if (existing.rows.length > 0) {
            // Update existing student
            await client.query(
              `UPDATE students 
               SET first_name = $1, last_name = $2, gender = $3, date_of_birth = $4,
                   class_id = $5, parent_id = $6, rfid_uid = $7, address = $8, status = $9
               WHERE student_id = $10`,
              [
                row.first_name,
                row.last_name,
                row.gender || 'Male',
                row.date_of_birth || null,
                row.class_id || null,
                row.parent_id || null,
                row.rfid_uid || null,
                row.address || null,
                row.status || 'ACTIVE',
                row.student_id
              ]
            );
          } else {
            // Insert new student
            await client.query(
              `INSERT INTO students (student_id, first_name, last_name, gender, date_of_birth, 
                                     class_id, parent_id, rfid_uid, address, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                row.student_id,
                row.first_name,
                row.last_name,
                row.gender || 'Male',
                row.date_of_birth || null,
                row.class_id || null,
                row.parent_id || null,
                row.rfid_uid || null,
                row.address || null,
                row.status || 'ACTIVE'
              ]
            );
          }

          imported++;
        } catch (err) {
          errors.push({ row, error: err.message });
        }
      }

      await client.query('COMMIT');

      logger.info(`Excel import: ${imported} students imported, ${errors.length} errors`);

      res.json({
        success: true,
        imported,
        total: data.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Excel import error:', error);
    res.status(500).json({ error: 'Failed to import students' });
  }
});

// Export Students to Excel
router.get('/export/students', async (req, res) => {
  try {
    const { classId, status } = req.query;

    let query = `
      SELECT s.student_id, s.first_name, s.last_name, s.gender, s.date_of_birth,
             c.grade, c.section, s.rfid_uid, s.status, s.registration_date,
             p.first_name as parent_first_name, p.last_name as parent_last_name,
             p.phone as parent_phone
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN parents p ON s.parent_id = p.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (classId) {
      query += ` AND s.class_id = $${paramIndex}`;
      params.push(classId);
      paramIndex++;
    }

    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY s.student_id';

    const result = await db.query(query, params);

    // Format data for Excel
    const excelData = result.rows.map(row => ({
      'Student ID': row.student_id,
      'First Name': row.first_name,
      'Last Name': row.last_name,
      'Gender': row.gender,
      'Date of Birth': row.date_of_birth,
      'Grade': row.grade,
      'Section': row.section,
      'RFID UID': row.rfid_uid,
      'Status': row.status,
      'Registration Date': row.registration_date,
      'Parent First Name': row.parent_first_name,
      'Parent Last Name': row.parent_last_name,
      'Parent Phone': row.parent_phone
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students_export.xlsx');
    res.send(buffer);

    logger.info(`Excel export: ${result.rows.length} students exported`);
  } catch (error) {
    logger.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to export students' });
  }
});

// Import Staff from Excel
router.post('/import/staff', async (req, res) => {
  try {
    const { data } = req.body; // Array of staff objects from Excel

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Invalid data format. Expected array of staff.' });
    }

    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      let imported = 0;
      let errors = [];

      for (const row of data) {
        try {
          // Validate required fields
          if (!row.staff_id || !row.first_name || !row.last_name) {
            errors.push({ row, error: 'Missing required fields (staff_id, first_name, last_name)' });
            continue;
          }

          // Check if staff already exists
          const existing = await client.query(
            'SELECT id FROM staff WHERE staff_id = $1',
            [row.staff_id]
          );

          if (existing.rows.length > 0) {
            // Update existing staff
            await client.query(
              `UPDATE staff 
               SET first_name = $1, last_name = $2, gender = $3, date_of_birth = $4,
                   position = $5, department = $6, phone_number = $7, email = $8,
                   rfid_uid = $9, employment_type = $10, date_joined = $11, status = $12
               WHERE staff_id = $13`,
              [
                row.first_name,
                row.last_name,
                row.gender || 'Male',
                row.date_of_birth || null,
                row.position,
                row.department,
                row.phone_number,
                row.email,
                row.rfid_uid || null,
                row.employment_type || 'FULL_TIME',
                row.date_joined || null,
                row.status || 'ACTIVE',
                row.staff_id
              ]
            );
          } else {
            // Insert new staff
            await client.query(
              `INSERT INTO staff (staff_id, first_name, last_name, gender, date_of_birth,
                                  position, department, phone_number, email, rfid_uid,
                                  employment_type, date_joined, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
              [
                row.staff_id,
                row.first_name,
                row.last_name,
                row.gender || 'Male',
                row.date_of_birth || null,
                row.position,
                row.department,
                row.phone_number,
                row.email,
                row.rfid_uid || null,
                row.employment_type || 'FULL_TIME',
                row.date_joined || null,
                row.status || 'ACTIVE'
              ]
            );
          }

          imported++;
        } catch (err) {
          errors.push({ row, error: err.message });
        }
      }

      await client.query('COMMIT');

      logger.info(`Excel import: ${imported} staff imported, ${errors.length} errors`);

      res.json({
        success: true,
        imported,
        total: data.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Excel import error:', error);
    res.status(500).json({ error: 'Failed to import staff' });
  }
});

// Export Staff to Excel
router.get('/export/staff', async (req, res) => {
  try {
    const { department, status } = req.query;

    let query = `
      SELECT staff_id, first_name, last_name, gender, date_of_birth,
             position, department, phone_number, email, rfid_uid,
             employment_type, date_joined, status
      FROM staff
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (department) {
      query += ` AND department = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY staff_id';

    const result = await db.query(query, params);

    // Format data for Excel
    const excelData = result.rows.map(row => ({
      'Staff ID': row.staff_id,
      'First Name': row.first_name,
      'Last Name': row.last_name,
      'Gender': row.gender,
      'Date of Birth': row.date_of_birth,
      'Position': row.position,
      'Department': row.department,
      'Phone Number': row.phone_number,
      'Email': row.email,
      'RFID UID': row.rfid_uid,
      'Employment Type': row.employment_type,
      'Date Joined': row.date_joined,
      'Status': row.status
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=staff_export.xlsx');
    res.send(buffer);

    logger.info(`Excel export: ${result.rows.length} staff exported`);
  } catch (error) {
    logger.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to export staff' });
  }
});

module.exports = router;
