import crypto from 'crypto';
import db from '../database.js';
import { createModuleLogger } from './logger.js';

const logger = createModuleLogger('otp-service');

// Configuration - more permissive in development
const isProduction = process.env.NODE_ENV === 'production';
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
const MAX_OTP_REQUESTS = isProduction ? 5 : 20; // Dev-friendly: 20 in dev, 5 in prod
const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 3; // Invalidate OTP after 3 failed attempts

/**
 * Generate a 6-digit numeric OTP
 */
export function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create and store a new OTP for a user
 */
export function createOTP(userId, ipAddress = null, userAgent = null) {
  const code = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  const stmt = db.prepare(`
    INSERT INTO otp_codes (user_id, code, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(userId, code, expiresAt.toISOString(), ipAddress, userAgent);

  logger.info({ userId, otpId: result.lastInsertRowid }, 'OTP created');

  // DEV ONLY: Log OTP to console for easy testing
  if (!isProduction) {
    console.log('\n' + '='.repeat(50));
    console.log(`🔑 DEV OTP CODE: ${code}`);
    console.log('='.repeat(50) + '\n');
  }

  return { code, expiresAt };
}

/**
 * Verify an OTP code for a user
 * Returns { valid: true } if valid
 * Returns { valid: false, reason: string } if invalid
 * Tracks failed attempts and invalidates OTP after MAX_FAILED_ATTEMPTS
 */
export function verifyOTP(userId, code) {
  const now = new Date().toISOString();

  // Find the most recent unused OTP for this user (regardless of code match)
  const latestOtpStmt = db.prepare(`
    SELECT * FROM otp_codes
    WHERE user_id = ? AND used = 0 AND expires_at > ?
    ORDER BY created_at DESC
    LIMIT 1
  `);

  const latestOtp = latestOtpStmt.get(userId, now);

  // No valid OTP exists
  if (!latestOtp) {
    logger.warn({ userId }, 'No valid OTP found for user');
    return { valid: false, reason: 'expired' };
  }

  // Check if too many failed attempts
  const failedAttempts = latestOtp.failed_attempts || 0;
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    // Invalidate this OTP
    db.prepare(`UPDATE otp_codes SET used = 1 WHERE id = ?`).run(latestOtp.id);
    logger.warn({ userId, failedAttempts }, 'OTP invalidated due to too many failed attempts');
    return { valid: false, reason: 'max_attempts' };
  }

  // Check if code matches
  if (latestOtp.code !== code) {
    // Increment failed attempts
    const newFailedAttempts = failedAttempts + 1;
    db.prepare(`UPDATE otp_codes SET failed_attempts = ? WHERE id = ?`).run(newFailedAttempts, latestOtp.id);

    const attemptsRemaining = MAX_FAILED_ATTEMPTS - newFailedAttempts;
    logger.warn({ userId, failedAttempts: newFailedAttempts, attemptsRemaining }, 'Invalid OTP code attempt');

    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      // Invalidate after max attempts reached
      db.prepare(`UPDATE otp_codes SET used = 1 WHERE id = ?`).run(latestOtp.id);
      return { valid: false, reason: 'max_attempts' };
    }

    return { valid: false, reason: 'invalid_code', attemptsRemaining };
  }

  // Code matches - mark as used
  db.prepare(`UPDATE otp_codes SET used = 1 WHERE id = ?`).run(latestOtp.id);

  // Invalidate all other unused OTPs for this user (security measure)
  db.prepare(`UPDATE otp_codes SET used = 1 WHERE user_id = ? AND used = 0`).run(userId);

  logger.info({ userId, otpId: latestOtp.id }, 'OTP verified successfully');
  return { valid: true };
}

/**
 * Check if an identifier (employee_id:ip) is rate limited
 * Returns true if allowed, false if rate limited
 */
export function checkRateLimit(identifier) {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);

  const stmt = db.prepare(`
    SELECT * FROM otp_rate_limits
    WHERE identifier = ? AND window_start > ?
  `);

  const record = stmt.get(identifier, windowStart.toISOString());

  if (record && record.request_count >= MAX_OTP_REQUESTS) {
    logger.warn({ identifier, requestCount: record.request_count }, 'OTP rate limit exceeded');
    return false;
  }

  return true;
}

/**
 * Increment the rate limit counter for an identifier
 */
export function incrementRateLimit(identifier) {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);
  const now = new Date().toISOString();

  // Clean old records first
  db.prepare(`DELETE FROM otp_rate_limits WHERE window_start < ?`).run(windowStart.toISOString());

  // Check if record exists within window
  const existing = db.prepare(`
    SELECT * FROM otp_rate_limits WHERE identifier = ? AND window_start > ?
  `).get(identifier, windowStart.toISOString());

  if (existing) {
    // Increment counter
    db.prepare(`
      UPDATE otp_rate_limits SET request_count = request_count + 1 WHERE id = ?
    `).run(existing.id);
  } else {
    // Create new record
    db.prepare(`
      INSERT INTO otp_rate_limits (identifier, request_count, window_start)
      VALUES (?, 1, ?)
    `).run(identifier, now);
  }
}

/**
 * Get remaining OTP attempts for an identifier
 */
export function getRemainingAttempts(identifier) {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);

  const stmt = db.prepare(`
    SELECT request_count FROM otp_rate_limits
    WHERE identifier = ? AND window_start > ?
  `);

  const record = stmt.get(identifier, windowStart.toISOString());

  if (!record) {
    return MAX_OTP_REQUESTS;
  }

  return Math.max(0, MAX_OTP_REQUESTS - record.request_count);
}

/**
 * Cleanup expired OTPs (can be called periodically)
 */
export function cleanupExpiredOTPs() {
  const stmt = db.prepare(`DELETE FROM otp_codes WHERE expires_at < ?`);
  const result = stmt.run(new Date().toISOString());
  logger.debug({ deleted: result.changes }, 'Cleaned up expired OTPs');
  return result.changes;
}

/**
 * Cleanup old rate limit records (can be called periodically)
 */
export function cleanupRateLimits() {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);

  const stmt = db.prepare(`DELETE FROM otp_rate_limits WHERE window_start < ?`);
  const result = stmt.run(windowStart.toISOString());
  logger.debug({ deleted: result.changes }, 'Cleaned up old rate limit records');
  return result.changes;
}

export default {
  generateOTP,
  createOTP,
  verifyOTP,
  checkRateLimit,
  incrementRateLimit,
  getRemainingAttempts,
  cleanupExpiredOTPs,
  cleanupRateLimits
};
