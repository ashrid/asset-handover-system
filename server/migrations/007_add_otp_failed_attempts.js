/**
 * Migration: Add failed_attempts column to otp_codes table
 *
 * This tracks the number of failed verification attempts for each OTP,
 * allowing automatic invalidation after too many wrong attempts.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../assets.db');

const db = new Database(dbPath);

console.log('Running migration: Add failed_attempts column to otp_codes table...');

try {
  // Check if column already exists
  const tableInfo = db.prepare("PRAGMA table_info(otp_codes)").all();
  const hasColumn = tableInfo.some(col => col.name === 'failed_attempts');

  if (hasColumn) {
    console.log('Column failed_attempts already exists. Skipping migration.');
  } else {
    // Add failed_attempts column with default of 0
    db.exec(`
      ALTER TABLE otp_codes
      ADD COLUMN failed_attempts INTEGER DEFAULT 0;
    `);
    console.log('✅ Added failed_attempts column to otp_codes table');
  }

  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
