import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../database.js';
import { createModuleLogger } from './logger.js';

const logger = createModuleLogger('token-service');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Generate a JWT access token for a user
 */
export function generateAccessToken(user) {
  const payload = {
    userId: user.id,
    employeeId: user.employee_id,
    role: user.role,
    type: 'access'
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generate a refresh token and store its hash in the database
 */
export function generateRefreshToken(userId, ipAddress = null, userAgent = null) {
  // Generate random token
  const token = crypto.randomBytes(64).toString('hex');

  // Hash the token for storage (we store hash, return plain token)
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  // Store in database
  const stmt = db.prepare(`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(userId, tokenHash, expiresAt.toISOString(), ipAddress, userAgent);

  logger.info({ userId }, 'Refresh token created');

  return { token, expiresAt };
}

/**
 * Verify a JWT access token
 * Returns decoded payload if valid, null otherwise
 */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Ensure it's an access token
    if (decoded.type !== 'access') {
      logger.warn('Token type mismatch - expected access token');
      return null;
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.debug('Access token expired');
    } else if (error.name === 'JsonWebTokenError') {
      logger.debug({ error: error.message }, 'Invalid access token');
    } else {
      logger.warn({ error: error.message }, 'Access token verification failed');
    }
    return null;
  }
}

/**
 * Verify a refresh token against the database
 * Returns user info if valid, null otherwise
 */
export function verifyRefreshToken(token) {
  // Hash the provided token
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const now = new Date().toISOString();

  // Find the token in database
  const stmt = db.prepare(`
    SELECT rt.*, u.role, u.is_active, u.employee_id
    FROM refresh_tokens rt
    JOIN users u ON rt.user_id = u.id
    WHERE rt.token_hash = ? AND rt.revoked = 0 AND rt.expires_at > ?
  `);

  const record = stmt.get(tokenHash, now);

  if (!record) {
    logger.warn('Invalid or expired refresh token');
    return null;
  }

  // Check if user is still active
  if (!record.is_active) {
    logger.warn({ userId: record.user_id }, 'Refresh token for inactive user');
    return null;
  }

  return record;
}

/**
 * Revoke a specific refresh token
 */
export function revokeRefreshToken(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const stmt = db.prepare(`
    UPDATE refresh_tokens
    SET revoked = 1, revoked_at = ?
    WHERE token_hash = ?
  `);

  const result = stmt.run(new Date().toISOString(), tokenHash);
  logger.info({ changes: result.changes }, 'Refresh token revoked');
  return result.changes > 0;
}

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export function revokeAllUserTokens(userId) {
  const stmt = db.prepare(`
    UPDATE refresh_tokens
    SET revoked = 1, revoked_at = ?
    WHERE user_id = ? AND revoked = 0
  `);

  const result = stmt.run(new Date().toISOString(), userId);
  logger.info({ userId, revoked: result.changes }, 'All user refresh tokens revoked');
  return result.changes;
}

/**
 * Get active refresh token count for a user
 */
export function getActiveTokenCount(userId) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM refresh_tokens
    WHERE user_id = ? AND revoked = 0 AND expires_at > ?
  `);

  const result = stmt.get(userId, now);
  return result.count;
}

/**
 * Cleanup expired refresh tokens (can be called periodically)
 */
export function cleanupExpiredTokens() {
  const stmt = db.prepare(`DELETE FROM refresh_tokens WHERE expires_at < ?`);
  const result = stmt.run(new Date().toISOString());
  logger.debug({ deleted: result.changes }, 'Cleaned up expired refresh tokens');
  return result.changes;
}

/**
 * Cleanup revoked refresh tokens older than 30 days
 */
export function cleanupRevokedTokens() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const stmt = db.prepare(`
    DELETE FROM refresh_tokens WHERE revoked = 1 AND revoked_at < ?
  `);

  const result = stmt.run(thirtyDaysAgo.toISOString());
  logger.debug({ deleted: result.changes }, 'Cleaned up old revoked tokens');
  return result.changes;
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  getActiveTokenCount,
  cleanupExpiredTokens,
  cleanupRevokedTokens
};
