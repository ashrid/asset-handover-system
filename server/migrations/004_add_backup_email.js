import db from '../database.js';

/**
 * Migration: Add backup email and signed-by tracking
 *
 * Purpose: Enable backup email functionality where a senior/manager can sign
 * on behalf of an employee who is unavailable (vacation, sick leave, etc.)
 *
 * Changes:
 * - Add backup_email column to store optional backup email address
 * - Add signed_by_email column to track which email actually signed
 */
export function up() {
  console.log('Running migration: Add backup email fields...');

  // Add backup_email column for storing senior/manager backup email
  db.exec(`
    ALTER TABLE asset_assignments
    ADD COLUMN backup_email TEXT;
  `);
  console.log('✓ Added backup_email column to asset_assignments');

  // Add signed_by_email column to track which email (primary or backup) signed
  db.exec(`
    ALTER TABLE asset_assignments
    ADD COLUMN signed_by_email TEXT;
  `);
  console.log('✓ Added signed_by_email column to asset_assignments');

  console.log('Migration completed successfully!');
}

/**
 * Rollback migration (optional - for development)
 */
export function down() {
  console.log('Rolling back migration: Remove backup email fields...');

  // Note: SQLite does not support DROP COLUMN in older versions
  // For production, you may need to recreate the table
  console.warn('Warning: SQLite does not support DROP COLUMN.');
  console.warn('To rollback, you would need to:');
  console.warn('1. Create new table without these columns');
  console.warn('2. Copy data from old table');
  console.warn('3. Drop old table');
  console.warn('4. Rename new table');

  console.log('✓ Rollback noted (manual intervention required)');
}

// Auto-run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  up();
}
