import db from '../database.js';

/**
 * Migration: Add signature workflow fields to asset_assignments table
 * Phase 2: Digital Signature Workflow
 */
export function up() {
  console.log('Running migration: Add signature fields...');

  // Check if columns already exist to make migration idempotent
  const tableInfo = db.prepare("PRAGMA table_info(asset_assignments)").all();
  const existingColumns = tableInfo.map(col => col.name);

  const columnsToAdd = [
    { name: 'employee_name', type: 'TEXT' },
    { name: 'employee_id_number', type: 'TEXT' },
    { name: 'email', type: 'TEXT' },
    { name: 'office_college', type: 'TEXT' },
    { name: 'signature_token', type: 'TEXT UNIQUE' },
    { name: 'signature_data', type: 'TEXT' },
    { name: 'signature_date', type: 'DATETIME' },
    { name: 'is_signed', type: 'BOOLEAN DEFAULT 0' },
    { name: 'is_disputed', type: 'BOOLEAN DEFAULT 0' },
    { name: 'dispute_reason', type: 'TEXT' },
    { name: 'location_building', type: 'TEXT' },
    { name: 'location_floor', type: 'TEXT' },
    { name: 'location_section', type: 'TEXT' },
    { name: 'device_type', type: 'TEXT' },
    { name: 'token_expires_at', type: 'DATETIME' },
    { name: 'last_reminder_sent', type: 'DATETIME' },
    { name: 'reminder_count', type: 'INTEGER DEFAULT 0' }
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
 * Note: SQLite doesn't support DROP COLUMN, so this recreates the table
 */
export function down() {
  console.log('Rolling back migration: Remove signature fields...');
  console.warn('Note: SQLite does not support DROP COLUMN. Manual intervention required.');
  // In production, you would need to:
  // 1. Create a new table without the signature columns
  // 2. Copy data from old table
  // 3. Drop old table
  // 4. Rename new table
}

// Auto-run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  up();
}
