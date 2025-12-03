import express from 'express';
import { nanoid } from 'nanoid';
import db from '../database.js';
import { generateHandoverPDF } from '../services/pdfGenerator.js';
import { sendHandoverEmail } from '../services/emailService.js';

const router = express.Router();

// Create asset assignment and send handover email
router.post('/', async (req, res) => {
  try {
    const { employee_name, employee_id, email, office_college, backup_email, asset_ids } = req.body;

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

    // Generate unique signature token
    const signatureToken = nanoid(32); // 32-character unique token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    const insertAssignment = db.prepare(`
      INSERT INTO asset_assignments (
        employee_id,
        employee_name,
        employee_id_number,
        email,
        office_college,
        backup_email,
        signature_token,
        token_expires_at,
        is_signed
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    const insertAssignmentItem = db.prepare(`
      INSERT INTO assignment_items (assignment_id, asset_id)
      VALUES (?, ?)
    `);

    // Check if employee already exists
    let employeeRecord = db.prepare('SELECT * FROM employees WHERE email = ?').get(email);

    if (!employeeRecord) {
      const result = insertEmployee.run(employee_name, employee_id, email, office_college);
      employeeRecord = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
    }

    // Create assignment with signature token
    const assignmentResult = insertAssignment.run(
      employeeRecord.id,
      employee_name,
      employee_id,
      email,
      office_college,
      backup_email || null,
      signatureToken,
      expiresAt.toISOString(),
    );
    const assignmentId = assignmentResult.lastInsertRowid;

    // Add assets to assignment
    for (const assetId of asset_ids) {
      insertAssignmentItem.run(assignmentId, assetId);
    }

    // Get assets with full details
    const assets = db.prepare(`
      SELECT * FROM assets WHERE id IN (${asset_ids.map(() => '?').join(',')})
    `).all(...asset_ids);

    // Generate signing URL
    const signingUrl = `http://localhost:3000/sign/${signatureToken}`;

    // Send email with signing link to primary email
    await sendHandoverEmail({
      email: email,
      employeeName: employee_name,
      signingUrl: signingUrl,
      expiresAt: expiresAt,
      assetCount: assets.length,
      isPrimary: true
    });

    // Send email to backup email if provided
    if (backup_email) {
      await sendHandoverEmail({
        email: backup_email,
        employeeName: employee_name,
        employeeId: employee_id,
        primaryEmail: email,
        signingUrl: signingUrl,
        expiresAt: expiresAt,
        assetCount: assets.length,
        isPrimary: false
      });
    }

    res.json({
      message: 'Asset handover signing link sent successfully',
      assignment_id: assignmentId,
      signature_token: signatureToken,
      signing_url: signingUrl,
      expires_at: expiresAt
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
        aa.is_signed,
        aa.is_disputed,
        aa.signature_date,
        aa.token_expires_at,
        aa.reminder_count,
        aa.employee_name,
        aa.employee_id_number as employee_id,
        aa.email,
        aa.office_college,
        GROUP_CONCAT(a.asset_code) as asset_codes
      FROM asset_assignments aa
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
        aa.*
      FROM asset_assignments aa
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

// Get assignment by signature token (public endpoint for signing)
router.get('/sign/:token', (req, res) => {
  try {
    const { token } = req.params;

    // Get assignment by token
    const assignment = db.prepare(`
      SELECT
        aa.id,
        aa.employee_name,
        aa.employee_id_number,
        aa.email,
        aa.office_college,
        aa.assigned_at,
        aa.token_expires_at,
        aa.is_signed,
        aa.is_disputed,
        aa.signature_date
      FROM asset_assignments aa
      WHERE aa.signature_token = ?
    `).get(token);

    if (!assignment) {
      return res.status(404).json({ error: 'Invalid or expired signing link' });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(assignment.token_expires_at);
    if (now > expiresAt) {
      return res.status(410).json({ error: 'This signing link has expired' });
    }

    // Check if already signed
    if (assignment.is_signed) {
      return res.status(409).json({ error: 'This form has already been signed' });
    }

    // Get assigned assets
    const assets = db.prepare(`
      SELECT a.* FROM assets a
      JOIN assignment_items ai ON a.id = ai.asset_id
      WHERE ai.assignment_id = ?
    `).all(assignment.id);

    res.json({ ...assignment, assets });
  } catch (error) {
    console.error('Error fetching assignment by token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit signature (public endpoint)
router.post('/submit-signature/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { location_building, location_floor, location_section, device_type, signature_data, signing_email } = req.body;

    // Validate required fields (only signature is required, location is optional)
    if (!signature_data) {
      return res.status(400).json({ error: 'Signature is required' });
    }

    // Get assignment by token
    const assignment = db.prepare(`
      SELECT * FROM asset_assignments WHERE signature_token = ?
    `).get(token);

    if (!assignment) {
      return res.status(404).json({ error: 'Invalid signing link' });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(assignment.token_expires_at);
    if (now > expiresAt) {
      return res.status(410).json({ error: 'This signing link has expired' });
    }

    // Check if already signed
    if (assignment.is_signed) {
      return res.status(409).json({ error: 'This form has already been signed' });
    }

    // Update assignment with signature data
    const updateStmt = db.prepare(`
      UPDATE asset_assignments
      SET
        location_building = ?,
        location_floor = ?,
        location_section = ?,
        device_type = ?,
        signature_data = ?,
        signature_date = ?,
        signed_by_email = ?,
        is_signed = 1
      WHERE signature_token = ?
    `);

    updateStmt.run(
      location_building || null,
      location_floor || null,
      location_section || null,
      device_type || null,
      signature_data,
      now.toISOString(),
      signing_email || assignment.email,
      token
    );

    // Get assigned assets for PDF generation
    const assets = db.prepare(`
      SELECT a.* FROM assets a
      JOIN assignment_items ai ON a.id = ai.asset_id
      WHERE ai.assignment_id = ?
    `).all(assignment.id);

    // Generate signed PDF with signature data
    const pdfBuffer = await generateHandoverPDF({
      employee: {
        employee_name: assignment.employee_name,
        employee_id: assignment.employee_id_number,
        email: assignment.email,
        office_college: assignment.office_college
      },
      assets,
      signature: {
        signature_data: signature_data,
        signature_date: now.toISOString(),
        location_building: location_building,
        location_floor: location_floor,
        location_section: location_section,
        device_type: device_type,
        signed_by_email: signing_email || assignment.email,
        is_backup_signer: signing_email && signing_email !== assignment.email
      }
    });

    // Send signed PDF to both employee and admin
    await sendHandoverEmail({
      email: assignment.email,
      employeeName: assignment.employee_name,
      pdfBuffer
    });

    // Update pdf_sent status after successful email send
    const updatePdfStatus = db.prepare(`
      UPDATE asset_assignments
      SET pdf_sent = 1
      WHERE id = ?
    `);
    updatePdfStatus.run(assignment.id);

    res.json({
      message: 'Signature submitted successfully',
      signed_at: now.toISOString()
    });
  } catch (error) {
    console.error('Error submitting signature:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete assignment (only if not signed)
router.delete('/assignments/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Check if assignment exists
    const assignment = db.prepare(`
      SELECT * FROM asset_assignments WHERE id = ?
    `).get(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Prevent deletion of signed assignments
    if (assignment.is_signed) {
      return res.status(403).json({
        error: 'Cannot delete signed assignments'
      });
    }

    // Delete assignment items first (foreign key constraint)
    const deleteItems = db.prepare(`
      DELETE FROM assignment_items WHERE assignment_id = ?
    `);
    deleteItems.run(id);

    // Delete assignment
    const deleteAssignment = db.prepare(`
      DELETE FROM asset_assignments WHERE id = ?
    `);
    deleteAssignment.run(id);

    res.json({
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resend signing email
router.post('/resend/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get assignment by ID
    const assignment = db.prepare(`
      SELECT * FROM asset_assignments WHERE id = ?
    `).get(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if already signed
    if (assignment.is_signed) {
      return res.status(400).json({
        error: 'This assignment has already been signed'
      });
    }

    // Check if disputed
    if (assignment.is_disputed) {
      return res.status(400).json({
        error: 'This assignment is disputed. Please resolve the dispute before resending.'
      });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(assignment.token_expires_at);
    if (now > expiresAt) {
      return res.status(410).json({
        error: 'The signing link has expired. Please create a new assignment.'
      });
    }

    // Get assigned assets
    const assets = db.prepare(`
      SELECT a.* FROM assets a
      JOIN assignment_items ai ON a.id = ai.asset_id
      WHERE ai.assignment_id = ?
    `).all(id);

    // Generate signing URL
    const signingUrl = `http://localhost:3000/sign/${assignment.signature_token}`;

    // Resend email with signing link to primary email
    await sendHandoverEmail({
      email: assignment.email,
      employeeName: assignment.employee_name,
      signingUrl: signingUrl,
      expiresAt: expiresAt,
      assetCount: assets.length,
      isPrimary: true
    });

    // Resend to backup email if provided
    if (assignment.backup_email) {
      await sendHandoverEmail({
        email: assignment.backup_email,
        employeeName: assignment.employee_name,
        employeeId: assignment.employee_id_number,
        primaryEmail: assignment.email,
        signingUrl: signingUrl,
        expiresAt: expiresAt,
        assetCount: assets.length,
        isPrimary: false
      });
    }

    // Update reminder count
    const updateReminder = db.prepare(`
      UPDATE asset_assignments
      SET
        reminder_count = reminder_count + 1,
        last_reminder_sent = ?
      WHERE id = ?
    `);
    updateReminder.run(now.toISOString(), id);

    res.json({
      message: 'Signing email resent successfully'
    });
  } catch (error) {
    console.error('Error resending email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit dispute (public endpoint)
router.post('/dispute/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { dispute_reason } = req.body;

    if (!dispute_reason || !dispute_reason.trim()) {
      return res.status(400).json({ error: 'Dispute reason is required' });
    }

    // Get assignment by token
    const assignment = db.prepare(`
      SELECT * FROM asset_assignments WHERE signature_token = ?
    `).get(token);

    if (!assignment) {
      return res.status(404).json({ error: 'Invalid signing link' });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(assignment.token_expires_at);
    if (now > expiresAt) {
      return res.status(410).json({ error: 'This signing link has expired' });
    }

    // Check if already signed
    if (assignment.is_signed) {
      return res.status(409).json({ error: 'This form has already been signed and cannot be disputed' });
    }

    // Update assignment with dispute
    const updateStmt = db.prepare(`
      UPDATE asset_assignments
      SET
        is_disputed = 1,
        dispute_reason = ?
      WHERE signature_token = ?
    `);

    updateStmt.run(dispute_reason, token);

    res.json({
      message: 'Dispute submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting dispute:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
