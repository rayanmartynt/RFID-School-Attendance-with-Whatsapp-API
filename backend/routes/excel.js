import express from 'express';
import XLSX from 'xlsx';
import { db } from '../db/index.js';
import { students, staff, classes, parents } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Import Students from Excel
router.post('/import/students', async (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Invalid data format. Expected array of students.' });
    }

    let imported = 0;
    let errors = [];

    for (const row of data) {
      try {
        if (!row.student_id || !row.first_name || !row.last_name) {
          errors.push({ row, error: 'Missing required fields (student_id, first_name, last_name)' });
          continue;
        }

        const existing = await db
          .select()
          .from(students)
          .where(eq(students.studentId, row.student_id))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(students)
            .set({
              firstName: row.first_name,
              lastName: row.last_name,
              gender: row.gender || 'Male',
              dateOfBirth: row.date_of_birth || null,
              classId: row.class_id || null,
              parentId: row.parent_id || null,
              address: row.address || null,
              status: row.status || 'ACTIVE',
              updatedAt: new Date()
            })
            .where(eq(students.studentId, row.student_id));
        } else {
          await db
            .insert(students)
            .values({
              studentId: row.student_id,
              firstName: row.first_name,
              lastName: row.last_name,
              gender: row.gender || 'Male',
              dateOfBirth: row.date_of_birth || null,
              classId: row.class_id || null,
              parentId: row.parent_id || null,
              address: row.address || null,
              status: row.status || 'ACTIVE'
            });
        }

        imported++;
      } catch (err) {
        errors.push({ row, error: err.message });
      }
    }

    logger.info(`Excel import: ${imported} students imported, ${errors.length} errors`);

    res.json({
      success: true,
      imported,
      total: data.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    logger.error('Excel import error:', error);
    res.status(500).json({ error: 'Failed to import students' });
  }
});

// Export Students to Excel
router.get('/export/students', async (req, res) => {
  try {
    const { classId, status } = req.query;

    let query = db
      .select({
        studentId: students.studentId,
        firstName: students.firstName,
        lastName: students.lastName,
        gender: students.gender,
        dateOfBirth: students.dateOfBirth,
        grade: classes.grade,
        section: classes.section,
        status: students.status,
        registrationDate: students.registrationDate,
        parentFirstName: parents.firstName,
        parentLastName: parents.lastName,
        parentPhone: parents.phone
      })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .leftJoin(parents, eq(students.parentId, parents.id));

    const conditions = [];
    if (classId) {
      conditions.push(eq(students.classId, parseInt(classId)));
    }
    if (status) {
      conditions.push(eq(students.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(...conditions);
    }

    const results = await query;

    const excelData = results.map(row => ({
      'Student ID': row.studentId,
      'First Name': row.firstName,
      'Last Name': row.lastName,
      'Gender': row.gender,
      'Date of Birth': row.dateOfBirth,
      'Grade': row.grade,
      'Section': row.section,
      'Status': row.status,
      'Registration Date': row.registrationDate,
      'Parent First Name': row.parentFirstName,
      'Parent Last Name': row.parentLastName,
      'Parent Phone': row.parentPhone
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students_export.xlsx');
    res.send(buffer);

    logger.info(`Excel export: ${results.length} students exported`);
  } catch (error) {
    logger.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to export students' });
  }
});

// Import Staff from Excel
router.post('/import/staff', async (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Invalid data format. Expected array of staff.' });
    }

    let imported = 0;
    let errors = [];

    for (const row of data) {
      try {
        if (!row.staff_id || !row.first_name || !row.last_name) {
          errors.push({ row, error: 'Missing required fields (staff_id, first_name, last_name)' });
          continue;
        }

        const existing = await db
          .select()
          .from(staff)
          .where(eq(staff.staffId, row.staff_id))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(staff)
            .set({
              firstName: row.first_name,
              lastName: row.last_name,
              gender: row.gender || 'Male',
              dateOfBirth: row.date_of_birth || null,
              position: row.position,
              department: row.department,
              phone: row.phone_number,
              email: row.email,
              address: row.address,
              employmentType: row.employment_type || 'FULL_TIME',
              dateJoined: row.date_joined || null,
              status: row.status || 'ACTIVE',
              updatedAt: new Date()
            })
            .where(eq(staff.staffId, row.staff_id));
        } else {
          await db
            .insert(staff)
            .values({
              staffId: row.staff_id,
              firstName: row.first_name,
              lastName: row.last_name,
              gender: row.gender || 'Male',
              dateOfBirth: row.date_of_birth || null,
              position: row.position,
              department: row.department,
              phone: row.phone_number,
              email: row.email,
              address: row.address,
              employmentType: row.employment_type || 'FULL_TIME',
              dateJoined: row.date_joined || null,
              status: row.status || 'ACTIVE'
            });
        }

        imported++;
      } catch (err) {
        errors.push({ row, error: err.message });
      }
    }

    logger.info(`Excel import: ${imported} staff imported, ${errors.length} errors`);

    res.json({
      success: true,
      imported,
      total: data.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    logger.error('Excel import error:', error);
    res.status(500).json({ error: 'Failed to import staff' });
  }
});

// Export Staff to Excel
router.get('/export/staff', async (req, res) => {
  try {
    const { department, status } = req.query;

    let query = db
      .select()
      .from(staff);

    const conditions = [];
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

    const excelData = results.map(row => ({
      'Staff ID': row.staffId,
      'First Name': row.firstName,
      'Last Name': row.lastName,
      'Gender': row.gender,
      'Date of Birth': row.dateOfBirth,
      'Position': row.position,
      'Department': row.department,
      'Phone Number': row.phone,
      'Email': row.email,
      'Employment Type': row.employmentType,
      'Date Joined': row.dateJoined,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=staff_export.xlsx');
    res.send(buffer);

    logger.info(`Excel export: ${results.length} staff exported`);
  } catch (error) {
    logger.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to export staff' });
  }
});

export default router;
