import express from 'express';
import db from '../database.js';
import { generateHandoverPDF } from '../services/pdfGenerator.js';
import { sendHandoverEmail } from '../services/emailService.js';

const router = express.Router();

// Create asset assignment and send handover email
router.post('/', async (req, res) => {
  try {
    const { employee_name, employee_id, email, office_college, asset_ids } = req.body;

    if (!employee_name || !email || !asset_ids || asset_ids.length === 0) {
      return res.status(400).json({
        error: 'Employee Name, Email, and at least one asset are required'
      });
    }

    // Start transaction
    const insertEmployee = db.prepare(`
      INSERT INTO employees (employee_name, employee_id, email, office_college)
      VALUES (?, ?, ?, ?)
    `);

    const insertAssignment = db.prepare(`
      INSERT INTO asset_assignments (employee_id)
      VALUES (?)
    `);

    const insertAssignmentItem = db.prepare(`
      INSERT INTO assignment_items (assignment_id, asset_id)
      VALUES (?, ?)
    `);

    const updatePdfSent = db.prepare(`
      UPDATE asset_assignments SET pdf_sent = 1 WHERE id = ?
    `);

    // Check if employee already exists
    let employeeRecord = db.prepare('SELECT * FROM employees WHERE email = ?').get(email);

    if (!employeeRecord) {
      const result = insertEmployee.run(employee_name, employee_id, email, office_college);
      employeeRecord = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
    }

    // Create assignment
    const assignmentResult = insertAssignment.run(employeeRecord.id);
    const assignmentId = assignmentResult.lastInsertRowid;

    // Add assets to assignment
    for (const assetId of asset_ids) {
      insertAssignmentItem.run(assignmentId, assetId);
    }

    // Get assets with full details
    const assets = db.prepare(`
      SELECT * FROM assets WHERE id IN (${asset_ids.map(() => '?').join(',')})
    `).all(...asset_ids);

    // Generate PDF
    const pdfBuffer = await generateHandoverPDF({
      employee: employeeRecord,
      assets
    });

    // Send email with PDF
    await sendHandoverEmail({
      email: employeeRecord.email,
      employeeName: employeeRecord.employee_name,
      pdfBuffer
    });

    // Update assignment to mark PDF as sent
    updatePdfSent.run(assignmentId);

    res.json({
      message: 'Asset handover email sent successfully',
      assignment_id: assignmentId,
      employee: employeeRecord
    });
  } catch (error) {
    console.error('Error in handover:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all assignments
router.get('/assignments', (req, res) => {
  try {
    const assignments = db.prepare(`
      SELECT
        aa.id,
        aa.assigned_at,
        aa.pdf_sent,
        e.employee_name,
        e.employee_id,
        e.email,
        e.office_college,
        GROUP_CONCAT(a.asset_code) as asset_codes
      FROM asset_assignments aa
      JOIN employees e ON aa.employee_id = e.id
      LEFT JOIN assignment_items ai ON aa.id = ai.assignment_id
      LEFT JOIN assets a ON ai.asset_id = a.id
      GROUP BY aa.id
      ORDER BY aa.assigned_at DESC
    `).all();

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get assignment details
router.get('/assignments/:id', (req, res) => {
  try {
    const assignment = db.prepare(`
      SELECT
        aa.id,
        aa.assigned_at,
        aa.pdf_sent,
        e.*
      FROM asset_assignments aa
      JOIN employees e ON aa.employee_id = e.id
      WHERE aa.id = ?
    `).get(req.params.id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assets = db.prepare(`
      SELECT a.* FROM assets a
      JOIN assignment_items ai ON a.id = ai.asset_id
      WHERE ai.assignment_id = ?
    `).all(req.params.id);

    res.json({ ...assignment, assets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
