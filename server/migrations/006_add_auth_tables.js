import db from '../database.js';

/**
 * Migration: Add authentication tables
 * - users: System users linked to employees
 * - otp_codes: One-time password codes for login
 * - refresh_tokens: JWT refresh tokens
 * - otp_rate_limits: Rate limiting for OTP requests
 */
export function up() {
  console.log('Running migration: Add authentication tables...');

  // Users table - links to employees for login
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK(role IN ('admin', 'staff', 'viewer')),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
  console.log('  ✓ Created users table');

  // OTP codes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  console.log('  ✓ Created otp_codes table');

  // Refresh tokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      revoked INTEGER DEFAULT 0,
      revoked_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  console.log('  ✓ Created refresh_tokens table');

  // Rate limiting table
  db.exec(`
    CREATE TABLE IF NOT EXISTS otp_rate_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT NOT NULL UNIQUE,
      request_count INTEGER DEFAULT 1,
      window_start TEXT NOT NULL
    )
  `);
  console.log('  ✓ Created otp_rate_limits table');

  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_identifier ON otp_rate_limits(identifier)`);
  console.log('  ✓ Created indexes');

  console.log('Migration 006 completed successfully!');
}

export function down() {
  console.log('Rolling back migration: Remove authentication tables...');

  // Drop indexes first
  db.exec('DROP INDEX IF EXISTS idx_otp_rate_limits_identifier');
  db.exec('DROP INDEX IF EXISTS idx_refresh_tokens_expires_at');
  db.exec('DROP INDEX IF EXISTS idx_refresh_tokens_token_hash');
  db.exec('DROP INDEX IF EXISTS idx_refresh_tokens_user_id');
  db.exec('DROP INDEX IF EXISTS idx_otp_codes_expires_at');
  db.exec('DROP INDEX IF EXISTS idx_otp_codes_user_id');
  db.exec('DROP INDEX IF EXISTS idx_users_is_active');
  db.exec('DROP INDEX IF EXISTS idx_users_role');
  db.exec('DROP INDEX IF EXISTS idx_users_employee_id');

  // Drop tables
  db.exec('DROP TABLE IF EXISTS otp_rate_limits');
  db.exec('DROP TABLE IF EXISTS refresh_tokens');
  db.exec('DROP TABLE IF EXISTS otp_codes');
  db.exec('DROP TABLE IF EXISTS users');

  console.log('Rollback completed!');
}

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  up();
}
