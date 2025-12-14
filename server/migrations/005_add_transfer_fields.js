import db from '../database.js';

/**
 * Migration: Add transfer tracking fields to asset_assignments table
 * Phase 4.5: Asset Transfer Feature
 *
 * Purpose: Enable asset transfer between employees without recreating assignments
 *
 * Changes:
 * - transfer_status: NULL (normal), 'transferred_out' (source), 'transferred_in' (destination)
 * - transferred_from_id: References original assignment (for incoming transfers)
 * - transferred_to_id: References new assignment (for outgoing transfers)
 * - transfer_date: ISO timestamp of when transfer occurred
 * - transfer_reason: User-provided reason for the transfer
 */
export function up() {
  console.log('Running migration: Add transfer tracking fields...');

  // Check if columns already exist to make migration idempotent
  const tableInfo = db.prepare("PRAGMA table_info(asset_assignments)").all();
  const existingColumns = tableInfo.map(col => col.name);

  const columnsToAdd = [
    { name: 'transfer_status', type: 'TEXT' },
    { name: 'transferred_from_id', type: 'INTEGER' },
    { name: 'transferred_to_id', type: 'INTEGER' },
    { name: 'transfer_date', type: 'TEXT' },
    { name: 'transfer_reason', type: 'TEXT' }
  ];

  for (const column of columnsToAdd) {
    if (!existingColumns.includes(column.name)) {
      try {
        db.exec(`ALTER TABLE asset_assignments ADD COLUMN ${column.name} ${column.type}`);
        console.log(`✓ Added column: ${column.name}`);
      } catch (error) {
        console.error(`✗ Failed to add column ${column.name}:`, error.message);
      }
    } else {
      console.log(`→ Column ${column.name} already exists, skipping`);
    }
  }

  console.log('Migration completed successfully!');
}

/**
 * Rollback migration (optional - for development)
 * Note: SQLite doesn't support DROP COLUMN, so manual intervention required
 */
export function down() {
  console.log('Rolling back migration: Remove transfer fields...');
  console.warn('Note: SQLite does not support DROP COLUMN. Manual intervention required.');
  console.warn('To rollback, you would need to:');
  console.warn('1. Create new table without these columns');
  console.warn('2. Copy data from old table');
  console.warn('3. Drop old table');
  console.warn('4. Rename new table');
}

// Auto-run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  up();
}
