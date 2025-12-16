import express from 'express';
import db from '../database.js';
import { createOTP, verifyOTP, checkRateLimit, incrementRateLimit } from '../services/otpService.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../services/tokenService.js';
import { sendOTPEmail } from '../services/emailService.js';
import { authValidation } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { createModuleLogger } from '../services/logger.js';

const router = express.Router();
const logger = createModuleLogger('auth-routes');

/**
 * POST /api/auth/request-otp
 * Request an OTP to be sent to the employee's email
 */
router.post('/request-otp', authValidation.requestOTP, async (req, res) => {
  try {
    const { employee_id } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    // Rate limit check (by employee_id + IP)
    const identifier = `otp:${employee_id}:${ipAddress}`;
    if (!checkRateLimit(identifier)) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many OTP requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      });
    }

    // Find employee by employee_id (the ID number field, not the primary key)
    const employee = db.prepare(`
      SELECT * FROM employees WHERE employee_id = ?
    `).get(employee_id);

    if (!employee) {
      // Don't reveal if employee exists or not (security)
      logger.warn({ employeeId: employee_id }, 'OTP request for non-existent employee');
      return res.json({
        success: true,
        message: 'If an account exists, an OTP has been sent to your email'
      });
    }

    // Find user account linked to this employee
    const user = db.prepare(`
      SELECT u.*, e.email, e.employee_name
      FROM users u
      JOIN employees e ON u.employee_id = e.id
      WHERE e.employee_id = ? AND u.is_active = 1
    `).get(employee_id);

    if (!user) {
      // No user account or inactive - don't reveal this
      logger.warn({ employeeId: employee_id }, 'OTP request for employee without user account');
      return res.json({
        success: true,
        message: 'If an account exists, an OTP has been sent to your email'
      });
    }

    // Increment rate limit counter
    incrementRateLimit(identifier);

    // Generate OTP
    const { code, expiresAt } = createOTP(user.id, ipAddress, userAgent);

    // Send OTP email
    try {
      await sendOTPEmail({
        email: user.email,
        employeeName: user.employee_name,
        otpCode: code,
        expiresAt
      });
      logger.info({ userId: user.id, employeeId: employee_id }, 'OTP sent successfully');
    } catch (emailError) {
      logger.error({ error: emailError, userId: user.id }, 'Failed to send OTP email');
      // Don't reveal email failure to user
    }

    res.json({
      success: true,
      message: 'If an account exists, an OTP has been sent to your email'
    });
  } catch (error) {
    logger.error({ error }, 'Error requesting OTP');
    res.status(500).json({
      success: false,
      error: { message: 'Failed to process request', code: 'OTP_REQUEST_FAILED' }
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and issue access + refresh tokens
 */
router.post('/verify-otp', authValidation.verifyOTP, async (req, res) => {
  try {
    const { employee_id, otp_code } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    // Find user by employee_id
    const user = db.prepare(`
      SELECT u.*, e.email, e.employee_name, e.employee_id as emp_id_number, e.office_college
      FROM users u
      JOIN employees e ON u.employee_id = e.id
      WHERE e.employee_id = ? AND u.is_active = 1
    `).get(employee_id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
      });
    }

    // Verify OTP
    const isValid = verifyOTP(user.id, otp_code);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired OTP', code: 'INVALID_OTP' }
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const { token: refreshToken, expiresAt: refreshExpiresAt } = generateRefreshToken(
      user.id,
      ipAddress,
      userAgent
    );

    // Update last login
    db.prepare(`UPDATE users SET last_login_at = ? WHERE id = ?`).run(
      new Date().toISOString(),
      user.id
    );

    logger.info({ userId: user.id, employeeId: employee_id }, 'User logged in successfully');

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth'
    });

    res.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        employeeId: user.emp_id_number,
        name: user.employee_name,
        email: user.email,
        role: user.role,
        officeCollege: user.office_college
      }
    });
  } catch (error) {
    logger.error({ error }, 'Error verifying OTP');
    res.status(500).json({
      success: false,
      error: { message: 'Authentication failed', code: 'AUTH_FAILED' }
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token cookie
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { message: 'Refresh token required', code: 'REFRESH_REQUIRED' }
      });
    }

    const tokenRecord = verifyRefreshToken(refreshToken);

    if (!tokenRecord) {
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid refresh token', code: 'INVALID_REFRESH' }
      });
    }

    // Get fresh user data
    const user = db.prepare(`
      SELECT u.*, e.employee_name, e.email, e.employee_id as emp_id_number, e.office_college
      FROM users u
      JOIN employees e ON u.employee_id = e.id
      WHERE u.id = ?
    `).get(tokenRecord.user_id);

    if (!user || !user.is_active) {
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({
        success: false,
        error: { message: 'User not found or inactive', code: 'USER_INVALID' }
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        employeeId: user.emp_id_number,
        name: user.employee_name,
        email: user.email,
        role: user.role,
        officeCollege: user.office_college
      }
    });
  } catch (error) {
    logger.error({ error }, 'Error refreshing token');
    res.status(500).json({
      success: false,
      error: { message: 'Token refresh failed', code: 'REFRESH_FAILED' }
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout current session (revoke refresh token)
 */
router.post('/logout', authenticateToken, (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      revokeRefreshToken(refreshToken);
    }

    res.clearCookie('refreshToken', { path: '/api/auth' });

    logger.info({ userId: req.user.userId }, 'User logged out');

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error({ error }, 'Error during logout');
    res.status(500).json({
      success: false,
      error: { message: 'Logout failed', code: 'LOGOUT_FAILED' }
    });
  }
});

/**
 * POST /api/auth/logout-all
 * Logout from all devices (revoke all refresh tokens)
 */
router.post('/logout-all', authenticateToken, (req, res) => {
  try {
    revokeAllUserTokens(req.user.userId);
    res.clearCookie('refreshToken', { path: '/api/auth' });

    logger.info({ userId: req.user.userId }, 'User logged out from all devices');

    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (error) {
    logger.error({ error }, 'Error during logout-all');
    res.status(500).json({
      success: false,
      error: { message: 'Logout failed', code: 'LOGOUT_FAILED' }
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user info
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT u.id, u.role, u.is_active, u.created_at, u.last_login_at,
             e.employee_name, e.email, e.employee_id, e.office_college
      FROM users u
      JOIN employees e ON u.employee_id = e.id
      WHERE u.id = ?
    `).get(req.user.userId);

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
        name: user.employee_name,
        email: user.email,
        role: user.role,
        officeCollege: user.office_college,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
      }
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching user info');
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user info', code: 'FETCH_FAILED' }
    });
  }
});

export default router;
