import express from 'express';
import db from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { userValidation } from '../middleware/validation.js';
import { revokeAllUserTokens } from '../services/tokenService.js';
import { createModuleLogger } from '../services/logger.js';

const router = express.Router();
const logger = createModuleLogger('users-routes');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

/**
 * GET /api/users
 * List all users
 */
router.get('/', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.role, u.is_active, u.created_at, u.last_login_at,
             e.employee_name, e.email, e.employee_id, e.office_college,
             creator.employee_name as created_by_name
      FROM users u
      JOIN employees e ON u.employee_id = e.id
      LEFT JOIN users cu ON u.created_by = cu.id
      LEFT JOIN employees creator ON cu.employee_id = creator.id
      ORDER BY u.created_at DESC
    `).all();

    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        employeeId: user.employee_id,
        employeeName: user.employee_name,
        email: user.email,
        officeCollege: user.office_college,
        role: user.role,
        isActive: !!user.is_active,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        createdByName: user.created_by_name
      }))
    });
  } catch (error) {
    logger.error({ error }, 'Error listing users');
    res.status(500).json({
      success: false,
      error: { message: 'Failed to list users', code: 'LIST_FAILED' }
    });
  }
});

/**
 * GET /api/users/available/employees
 * Get employees not yet linked to user accounts
 */
router.get('/available/employees', (req, res) => {
  try {
    const employees = db.prepare(`
      SELECT e.*
      FROM employees e
      LEFT JOIN users u ON e.id = u.employee_id
      WHERE u.id IS NULL
      ORDER BY e.employee_name
    `).all();

    res.json({
      success: true,
      employees: employees.map(emp => ({
        id: emp.id,
        employeeId: emp.employee_id,
        employeeName: emp.employee_name,
        email: emp.email,
        officeCollege: emp.office_college
      }))
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching available employees');
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch employees', code: 'FETCH_FAILED' }
    });
  }
});

/**
 * GET /api/users/:id
 * Get single user
 */
router.get('/:id', userValidation.getUser, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT u.id, u.role, u.is_active, u.created_at, u.last_login_at,
             e.employee_name, e.email, e.employee_id, e.office_college
      FROM users u
      JOIN employees e ON u.employee_id = e.id
      WHERE u.id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        employeeId: user.employee_id,
        employeeName: user.employee_name,
        email: user.email,
        officeCollege: user.office_college,
        role: user.role,
        isActive: !!user.is_active,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
      }
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching user');
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user', code: 'FETCH_FAILED' }
    });
  }
});

/**
 * POST /api/users
 * Create new user (link employee to user account)
 */
router.post('/', userValidation.createUser, (req, res) => {
  try {
    const { employee_id, role } = req.body;

    // Check if employee exists (by primary key id)
    const employee = db.prepare(`SELECT * FROM employees WHERE id = ?`).get(employee_id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: { message: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' }
      });
    }

    // Check if user already exists for this employee
    const existingUser = db.prepare(`SELECT * FROM users WHERE employee_id = ?`).get(employee_id);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { message: 'User account already exists for this employee', code: 'USER_EXISTS' }
      });
    }

    // Create user
    const stmt = db.prepare(`
      INSERT INTO users (employee_id, role, created_by)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(employee_id, role, req.user.userId);

    logger.info({
      userId: result.lastInsertRowid,
      employeeId: employee_id,
      role,
      createdBy: req.user.userId
    }, 'User created');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: result.lastInsertRowid,
        employeeId: employee.employee_id,
        employeeName: employee.employee_name,
        email: employee.email,
        officeCollege: employee.office_college,
        role
      }
    });
  } catch (error) {
    logger.error({ error }, 'Error creating user');
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create user', code: 'CREATE_FAILED' }
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user (role/status)
 */
router.put('/:id', userValidation.updateUser, (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_active } = req.body;

    // Check if user exists
    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    // Prevent self-demotion or self-deactivation
    if (parseInt(id) === req.user.userId) {
      if (role && role !== user.role) {
        return res.status(400).json({
          success: false,
          error: { message: 'Cannot change your own role', code: 'SELF_ROLE_CHANGE' }
        });
      }
      if (is_active === false || is_active === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Cannot deactivate your own account', code: 'SELF_DEACTIVATE' }
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No fields to update', code: 'NO_UPDATE' }
      });
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    // If deactivated, revoke all refresh tokens
    if (is_active === false || is_active === 0) {
      revokeAllUserTokens(parseInt(id));
    }

    logger.info({ userId: id, role, is_active, updatedBy: req.user.userId }, 'User updated');

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    logger.error({ error }, 'Error updating user');
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update user', code: 'UPDATE_FAILED' }
    });
  }
});

/**
 * DELETE /api/users/:id
 * Soft delete (deactivate) user
 */
router.delete('/:id', userValidation.deleteUser, (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot delete your own account', code: 'SELF_DELETE' }
      });
    }

    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    // Soft delete (deactivate)
    db.prepare(`UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?`).run(
      new Date().toISOString(),
      id
    );

    // Revoke all refresh tokens
    revokeAllUserTokens(parseInt(id));

    logger.info({ userId: id, deletedBy: req.user.userId }, 'User deactivated');

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    logger.error({ error }, 'Error deleting user');
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete user', code: 'DELETE_FAILED' }
    });
  }
});

/**
 * PUT /api/users/:id/reactivate
 * Reactivate a deactivated user
 */
router.put('/:id/reactivate', userValidation.getUser, (req, res) => {
  try {
    const { id } = req.params;

    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    if (user.is_active) {
      return res.status(400).json({
        success: false,
        error: { message: 'User is already active', code: 'ALREADY_ACTIVE' }
      });
    }

    db.prepare(`UPDATE users SET is_active = 1, updated_at = ? WHERE id = ?`).run(
      new Date().toISOString(),
      id
    );

    logger.info({ userId: id, reactivatedBy: req.user.userId }, 'User reactivated');

    res.json({ success: true, message: 'User reactivated successfully' });
  } catch (error) {
    logger.error({ error }, 'Error reactivating user');
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reactivate user', code: 'REACTIVATE_FAILED' }
    });
  }
});

export default router;
