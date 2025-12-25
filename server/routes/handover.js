import express from 'express';
import { nanoid } from 'nanoid';
import db from '../database.js';
import { generateHandoverPDF } from '../services/pdfGenerator.js';
import { sendHandoverEmail } from '../services/emailService.js';
import { handoverValidation } from '../middleware/validation.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware helpers for this route
const requireAuth = authenticateToken;
const requireStaff = [authenticateToken, requireRole('admin', 'staff')];

// Create asset assignment and send handover email (staff/admin only)
router.post('/', requireStaff, handoverValidation.create, async (req, res) => {
  try {
    const { employee_name, employee_id, email, office_college, backup_email, asset_ids } = req.body;

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
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const signingUrl = `${baseUrl}/sign/${signatureToken}`;

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

// Get all assignments (any authenticated user)
router.get('/assignments', requireAuth, (req, res) => {
  try {
    const assignments = db.prepare(`
      SELECT
        aa.id,
        aa.assigned_at,
        aa.pdf_sent,
        aa.is_signed,
        aa.is_disputed,
        aa.signature_date,
        aa.signed_by_email,
        aa.token_expires_at,
        aa.reminder_count,
        aa.employee_name,
        aa.employee_id_number as employee_id,
        aa.email,
        aa.office_college,
        aa.transfer_status,
        aa.transferred_from_id,
        aa.transferred_to_id,
        aa.transfer_date,
        aa.transfer_reason,
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

// Get assignment details (any authenticated user)
router.get('/assignments/:id', requireAuth, (req, res) => {
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
router.post('/submit-signature/:token', handoverValidation.submitSignature, async (req, res) => {
  try {
    const { token } = req.params;
    const { location_building, location_floor, location_section, device_type, signature_data, signing_email } = req.body;

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

    // Send signed PDF to employee
    await sendHandoverEmail({
      email: assignment.email,
      employeeName: assignment.employee_name,
      pdfBuffer
    });

    // Send signed PDF to admin if ADMIN_EMAIL is configured
    if (process.env.ADMIN_EMAIL) {
      await sendHandoverEmail({
        email: process.env.ADMIN_EMAIL,
        employeeName: assignment.employee_name,
        employeeId: assignment.employee_id_number,
        officeCollege: assignment.office_college,
        assetCount: assets.length,
        signatureDate: now,
        pdfBuffer,
        isAdminCopy: true
      });
    }

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

// Delete assignment (only if not signed) - staff/admin only
router.delete('/assignments/:id', requireStaff, (req, res) => {
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

// Resend signing email (staff/admin only)
router.post('/resend/:id', requireStaff, handoverValidation.resend, async (req, res) => {
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
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const signingUrl = `${baseUrl}/sign/${assignment.signature_token}`;

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
router.post('/dispute/:token', handoverValidation.submitDispute, async (req, res) => {
  try {
    const { token } = req.params;
    const { dispute_reason } = req.body;

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

    // Send dispute notification to admin if ADMIN_EMAIL is configured
    if (process.env.ADMIN_EMAIL) {
      // Get assigned assets for email
      const assets = db.prepare(`
        SELECT a.* FROM assets a
        JOIN assignment_items ai ON a.id = ai.asset_id
        WHERE ai.assignment_id = ?
      `).all(assignment.id);

      await sendHandoverEmail({
        email: process.env.ADMIN_EMAIL,
        employeeName: assignment.employee_name,
        employeeId: assignment.employee_id_number,
        employeeEmail: assignment.email,
        officeCollege: assignment.office_college,
        assignmentId: assignment.id,
        assets: assets,
        disputeReason: dispute_reason,
        isDispute: true
      });
    }

    res.json({
      message: 'Dispute submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting dispute:', error);
    res.status(500).json({ error: error.message });
  }
});

// Edit assets in an existing assignment (staff/admin only)
router.put('/assignments/:id/assets', requireStaff, handoverValidation.updateAssets, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { asset_ids, send_notification } = req.body;

    // Get assignment details
    const assignment = db.prepare(`
      SELECT * FROM asset_assignments WHERE id = ?
    `).get(assignmentId);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if assignment can be edited
    if (assignment.is_signed) {
      return res.status(403).json({
        error: 'Cannot edit signed assignments'
      });
    }

    if (assignment.is_disputed) {
      return res.status(403).json({
        error: 'Cannot edit disputed assignments'
      });
    }

    // Delete existing assignment items
    const deleteStmt = db.prepare(`
      DELETE FROM assignment_items WHERE assignment_id = ?
    `);
    deleteStmt.run(assignmentId);

    // Insert new assignment items
    const insertStmt = db.prepare(`
      INSERT INTO assignment_items (assignment_id, asset_id)
      VALUES (?, ?)
    `);

    for (const assetId of asset_ids) {
      insertStmt.run(assignmentId, assetId);
    }

    // Get updated assets list
    const assets = db.prepare(`
      SELECT * FROM assets WHERE id IN (${asset_ids.map(() => '?').join(',')})
    `).all(...asset_ids);

    // Send updated notification email if requested
    if (send_notification) {
      const signingUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/sign/${assignment.signature_token}`;
      const expiresAt = new Date(assignment.token_expires_at);

      await sendHandoverEmail({
        email: assignment.email,
        employeeName: assignment.employee_name,
        signingUrl: signingUrl,
        expiresAt: expiresAt,
        assetCount: assets.length,
        isPrimary: true
      });

      // Also send to backup email if exists
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
    }

    res.json({
      success: true,
      message: `Assignment updated successfully with ${assets.length} assets${send_notification ? '. Notification emails sent.' : ''}`,
      assignment: {
        id: assignment.id,
        asset_count: assets.length
      }
    });
  } catch (error) {
    console.error('Error editing assignment assets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Transfer assets from a signed assignment to a new employee (staff/admin only)
router.post('/transfer/:id', requireStaff, handoverValidation.transfer, async (req, res) => {
  try {
    const originalAssignmentId = req.params.id;
    const {
      new_employee_name,
      new_employee_id,
      new_email,
      new_office_college,
      new_backup_email,
      asset_ids,
      transfer_reason,
      notify_original_employee
    } = req.body;

    // Get original assignment
    const originalAssignment = db.prepare(`
      SELECT * FROM asset_assignments WHERE id = ?
    `).get(originalAssignmentId);

    if (!originalAssignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Validate: must be signed
    if (!originalAssignment.is_signed) {
      return res.status(400).json({
        error: 'Can only transfer assets from signed assignments'
      });
    }

    // Validate: must not be disputed
    if (originalAssignment.is_disputed) {
      return res.status(400).json({
        error: 'Cannot transfer assets from disputed assignments'
      });
    }

    // Validate: must not already be transferred out
    if (originalAssignment.transfer_status === 'transferred_out') {
      return res.status(400).json({
        error: 'This assignment has already been transferred'
      });
    }

    // Validate: new email must be different from original
    if (new_email.toLowerCase() === originalAssignment.email.toLowerCase()) {
      return res.status(400).json({
        error: 'New employee email must be different from original employee'
      });
    }

    // Get original assignment assets
    const originalAssets = db.prepare(`
      SELECT a.id FROM assets a
      JOIN assignment_items ai ON a.id = ai.asset_id
      WHERE ai.assignment_id = ?
    `).all(originalAssignmentId);

    const originalAssetIds = originalAssets.map(a => a.id);

    // Validate: requested assets must belong to original assignment
    const invalidAssets = asset_ids.filter(id => !originalAssetIds.includes(id));
    if (invalidAssets.length > 0) {
      return res.status(400).json({
        error: `Assets with IDs [${invalidAssets.join(', ')}] do not belong to this assignment`
      });
    }

    // Get full asset details for transfer
    const transferredAssets = db.prepare(`
      SELECT * FROM assets WHERE id IN (${asset_ids.map(() => '?').join(',')})
    `).all(...asset_ids);

    // Calculate remaining assets
    const remainingAssetIds = originalAssetIds.filter(id => !asset_ids.includes(id));

    // Generate new signature token
    const signatureToken = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const now = new Date();

    // Check/create employee record for new employee
    let newEmployeeRecord = db.prepare('SELECT * FROM employees WHERE email = ?').get(new_email);
    if (!newEmployeeRecord) {
      const insertEmployee = db.prepare(`
        INSERT INTO employees (employee_name, employee_id, email, office_college)
        VALUES (?, ?, ?, ?)
      `);
      const result = insertEmployee.run(new_employee_name, new_employee_id, new_email, new_office_college || null);
      newEmployeeRecord = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
    }

    // Create new assignment for recipient
    const insertNewAssignment = db.prepare(`
      INSERT INTO asset_assignments (
        employee_id,
        employee_name,
        employee_id_number,
        email,
        office_college,
        backup_email,
        signature_token,
        token_expires_at,
        is_signed,
        transfer_status,
        transferred_from_id,
        transfer_date,
        transfer_reason
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'transferred_in', ?, ?, ?)
    `);

    const newAssignmentResult = insertNewAssignment.run(
      newEmployeeRecord.id,
      new_employee_name,
      new_employee_id,
      new_email,
      new_office_college || null,
      new_backup_email || null,
      signatureToken,
      expiresAt.toISOString(),
      originalAssignmentId,
      now.toISOString(),
      transfer_reason
    );
    const newAssignmentId = newAssignmentResult.lastInsertRowid;

    // Insert assignment items for new assignment
    const insertAssignmentItem = db.prepare(`
      INSERT INTO assignment_items (assignment_id, asset_id)
      VALUES (?, ?)
    `);

    for (const assetId of asset_ids) {
      insertAssignmentItem.run(newAssignmentId, assetId);
    }

    // Remove transferred assets from original assignment
    if (remainingAssetIds.length > 0) {
      // Partial transfer: remove only transferred assets
      const deleteTransferredItems = db.prepare(`
        DELETE FROM assignment_items
        WHERE assignment_id = ? AND asset_id IN (${asset_ids.map(() => '?').join(',')})
      `);
      deleteTransferredItems.run(originalAssignmentId, ...asset_ids);
    } else {
      // Full transfer: all assets transferred
      const deleteAllItems = db.prepare(`
        DELETE FROM assignment_items WHERE assignment_id = ?
      `);
      deleteAllItems.run(originalAssignmentId);
    }

    // Update original assignment with transfer status
    const updateOriginal = db.prepare(`
      UPDATE asset_assignments
      SET
        transfer_status = 'transferred_out',
        transferred_to_id = ?,
        transfer_date = ?,
        transfer_reason = ?
      WHERE id = ?
    `);
    updateOriginal.run(newAssignmentId, now.toISOString(), transfer_reason, originalAssignmentId);

    // Generate signing URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const signingUrl = `${baseUrl}/sign/${signatureToken}`;

    // Send signing email to new employee
    await sendHandoverEmail({
      email: new_email,
      employeeName: new_employee_name,
      signingUrl: signingUrl,
      expiresAt: expiresAt,
      assetCount: transferredAssets.length,
      originalEmployeeName: originalAssignment.employee_name,
      isTransfer: true
    });

    // Send to backup email if provided
    if (new_backup_email) {
      await sendHandoverEmail({
        email: new_backup_email,
        employeeName: new_employee_name,
        employeeId: new_employee_id,
        primaryEmail: new_email,
        signingUrl: signingUrl,
        expiresAt: expiresAt,
        assetCount: transferredAssets.length,
        isPrimary: false
      });
    }

    // Send notification to original employee if requested
    if (notify_original_employee) {
      await sendHandoverEmail({
        email: originalAssignment.email,
        employeeName: originalAssignment.employee_name,
        assetCount: transferredAssets.length,
        assets: transferredAssets,
        transferReason: transfer_reason,
        isTransferNotification: true
      });
    }

    // Send admin notification if configured
    if (process.env.ADMIN_EMAIL) {
      await sendHandoverEmail({
        email: process.env.ADMIN_EMAIL,
        employeeName: new_employee_name,
        employeeId: new_employee_id,
        officeCollege: new_office_college,
        assetCount: transferredAssets.length,
        assets: transferredAssets,
        originalEmployeeName: originalAssignment.employee_name,
        originalEmail: originalAssignment.email,
        transferReason: transfer_reason,
        isTransfer: true,
        isAdminCopy: true
      });
    }

    res.status(201).json({
      message: 'Assets transferred successfully',
      original_assignment_id: parseInt(originalAssignmentId),
      new_assignment_id: newAssignmentId,
      signing_url: signingUrl,
      expires_at: expiresAt.toISOString(),
      transferred_asset_count: transferredAssets.length,
      remaining_asset_count: remainingAssetIds.length
    });
  } catch (error) {
    console.error('Error transferring assets:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
