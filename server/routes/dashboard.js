
import express from 'express';
const router = express.Router();
import db from '../database.js';

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

export default router;
