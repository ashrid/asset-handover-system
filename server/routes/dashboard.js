import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import db from '../database.js';

const router = express.Router();

// All dashboard routes require authentication (any role can view)
router.use(requireAuth);

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  try {
    const totalAssignments = db.prepare('SELECT COUNT(*) as count FROM asset_assignments').get().count;
    const signedAssignments = db.prepare('SELECT COUNT(*) as count FROM asset_assignments WHERE is_signed = 1').get().count;
    const unsignedAssignments = db.prepare('SELECT COUNT(*) as count FROM asset_assignments WHERE is_signed = 0 AND is_disputed = 0').get().count;
    const disputedAssignments = db.prepare('SELECT COUNT(*) as count FROM asset_assignments WHERE is_disputed = 1').get().count;

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const expiringSoon = db.prepare(`
      SELECT COUNT(*) as count
      FROM asset_assignments
      WHERE is_signed = 0
        AND is_disputed = 0
        AND token_expires_at <= ?
    `).get(sevenDaysFromNow.toISOString()).count;

    const totalAssets = db.prepare('SELECT COUNT(*) as count FROM assets').get().count;
    const assignedAssets = db.prepare('SELECT COUNT(DISTINCT asset_id) as count FROM assignment_items JOIN asset_assignments ON asset_assignments.id = assignment_items.assignment_id WHERE asset_assignments.is_signed = 0').get().count;

    const mostFrequentAssets = db.prepare(`
        SELECT a.asset_code, a.description, COUNT(ai.asset_id) as assignment_count
        FROM assets a
        JOIN assignment_items ai ON a.id = ai.asset_id
        GROUP BY ai.asset_id
        ORDER BY assignment_count DESC
        LIMIT 5
    `).all();

    const stats = {
      totalAssignments,
      signedAssignments,
      unsignedAssignments,
      disputedAssignments,
      expiringSoon,
      totalAssets,
      assignedAssets,
      mostFrequentAssets
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// GET /api/dashboard/charts
router.get('/charts', (req, res) => {
  try {
    const assignmentTrends = db.prepare(`
        SELECT strftime('%Y-%m', assigned_at) as month, COUNT(*) as count
        FROM asset_assignments
        GROUP BY month
        ORDER BY month
    `).all();

    const signRateByDept = db.prepare(`
        SELECT office_college,
               CAST(SUM(CASE WHEN is_signed = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100 as sign_rate
        FROM asset_assignments
        GROUP BY office_college
        HAVING COUNT(*) > 0
    `).all();

    res.json({ assignmentTrends, signRateByDept });

  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ message: 'Error fetching chart data' });
  }
});

// GET /api/dashboard/activity
router.get('/activity', (req, res) => {
  try {
    const recentSignatures = db.prepare(`
        SELECT id, employee_name, signature_date
        FROM asset_assignments
        WHERE is_signed = 1
        ORDER BY signature_date DESC
        LIMIT 5
    `).all();

    const recentAssignments = db.prepare(`
        SELECT id, employee_name, assigned_at
        FROM asset_assignments
        ORDER BY assigned_at DESC
        LIMIT 5
    `).all();

    const recentDisputes = db.prepare(`
        SELECT id, employee_name, dispute_reason
        FROM asset_assignments
        WHERE is_disputed = 1
        ORDER BY id DESC
        LIMIT 5
    `).all();

    res.json({ recentSignatures, recentAssignments, recentDisputes });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Error fetching recent activity' });
  }
});

// GET /api/dashboard/pending-signatures
// Returns assignments awaiting signature with employee details and urgency info
router.get('/pending-signatures', (req, res) => {
  try {
    const now = new Date();

    const pendingSignatures = db.prepare(`
      SELECT
        aa.id,
        aa.employee_name,
        aa.email,
        aa.office_college,
        aa.token_expires_at,
        aa.reminder_count,
        aa.last_reminder_sent,
        aa.assigned_at,
        (SELECT COUNT(*) FROM assignment_items WHERE assignment_id = aa.id) as asset_count,
        CAST((julianday(aa.token_expires_at) - julianday('now')) AS INTEGER) as days_remaining
      FROM asset_assignments aa
      WHERE aa.is_signed = 0
        AND aa.is_disputed = 0
        AND (aa.transfer_status IS NULL OR aa.transfer_status != 'transferred_out')
        AND datetime(aa.token_expires_at) > datetime('now')
      ORDER BY aa.token_expires_at ASC
      LIMIT 10
    `).all();

    // Add urgency flag (urgent if 3 days or less remaining)
    const enrichedData = pendingSignatures.map(item => ({
      ...item,
      is_urgent: item.days_remaining <= 3,
      can_send_reminder: !item.last_reminder_sent ||
        (new Date(item.last_reminder_sent).getTime() + 24 * 60 * 60 * 1000) < now.getTime()
    }));

    res.json(enrichedData);
  } catch (error) {
    console.error('Error fetching pending signatures:', error);
    res.status(500).json({ message: 'Error fetching pending signatures' });
  }
});

// GET /api/dashboard/recent-transfers
// Returns recent asset transfers between employees
router.get('/recent-transfers', (req, res) => {
  try {
    // Get assignments that are transfers (transferred_in status)
    const transfers = db.prepare(`
      SELECT
        aa_new.id,
        aa_new.employee_name as to_employee,
        aa_new.transfer_date,
        aa_new.transfer_reason,
        aa_old.employee_name as from_employee,
        (
          SELECT GROUP_CONCAT(a.description || ' (' || a.asset_code || ')', ', ')
          FROM assignment_items ai
          JOIN assets a ON a.id = ai.asset_id
          WHERE ai.assignment_id = aa_new.id
          LIMIT 1
        ) as asset_info,
        (SELECT COUNT(*) FROM assignment_items WHERE assignment_id = aa_new.id) as asset_count
      FROM asset_assignments aa_new
      LEFT JOIN asset_assignments aa_old ON aa_new.transferred_from_id = aa_old.id
      WHERE aa_new.transfer_status = 'transferred_in'
      ORDER BY aa_new.transfer_date DESC
      LIMIT 5
    `).all();

    res.json(transfers);
  } catch (error) {
    console.error('Error fetching recent transfers:', error);
    res.status(500).json({ message: 'Error fetching recent transfers' });
  }
});

// GET /api/dashboard/timeline
// Unified activity timeline combining signatures, assignments, transfers, and disputes
router.get('/timeline', (req, res) => {
  try {
    // Get recent signatures
    const signatures = db.prepare(`
      SELECT
        id,
        'signature' as event_type,
        employee_name,
        signature_date as event_date,
        (SELECT COUNT(*) FROM assignment_items WHERE assignment_id = asset_assignments.id) as asset_count,
        NULL as extra_info
      FROM asset_assignments
      WHERE is_signed = 1 AND signature_date IS NOT NULL
      ORDER BY signature_date DESC
      LIMIT 5
    `).all();

    // Get recent assignments (new, not transferred)
    const assignments = db.prepare(`
      SELECT
        id,
        'assignment' as event_type,
        employee_name,
        assigned_at as event_date,
        (SELECT COUNT(*) FROM assignment_items WHERE assignment_id = asset_assignments.id) as asset_count,
        office_college as extra_info
      FROM asset_assignments
      WHERE transfer_status IS NULL OR transfer_status = ''
      ORDER BY assigned_at DESC
      LIMIT 5
    `).all();

    // Get recent transfers
    const transfers = db.prepare(`
      SELECT
        aa_new.id,
        'transfer' as event_type,
        aa_new.employee_name,
        aa_new.transfer_date as event_date,
        (SELECT COUNT(*) FROM assignment_items WHERE assignment_id = aa_new.id) as asset_count,
        aa_old.employee_name as extra_info
      FROM asset_assignments aa_new
      LEFT JOIN asset_assignments aa_old ON aa_new.transferred_from_id = aa_old.id
      WHERE aa_new.transfer_status = 'transferred_in'
      ORDER BY aa_new.transfer_date DESC
      LIMIT 5
    `).all();

    // Get recent disputes
    const disputes = db.prepare(`
      SELECT
        id,
        'dispute' as event_type,
        employee_name,
        assigned_at as event_date,
        (SELECT COUNT(*) FROM assignment_items WHERE assignment_id = asset_assignments.id) as asset_count,
        dispute_reason as extra_info
      FROM asset_assignments
      WHERE is_disputed = 1
      ORDER BY id DESC
      LIMIT 5
    `).all();

    // Combine and sort all events by date, take top 5
    const allEvents = [...signatures, ...assignments, ...transfers, ...disputes]
      .filter(e => e.event_date)
      .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
      .slice(0, 5);

    res.json(allEvents);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ message: 'Error fetching timeline' });
  }
});

export default router;
