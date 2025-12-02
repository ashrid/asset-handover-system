import db from '../database.js';

/**
 * Migration: Add location_options table for dynamic location management
 * Phase 2 Enhancement: Admin-manageable location options
 */
export function up() {
  console.log('Running migration: Add location_options table...');

  // Create location_options table
  db.exec(`
    CREATE TABLE IF NOT EXISTS location_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,  -- 'building', 'floor', 'section'
      value TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, value)  -- Prevent duplicates
    )
  `);
  console.log('✓ Created location_options table');

  // Create index for faster category-based queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_location_category
    ON location_options(category, display_order)
  `);
  console.log('✓ Created index on category and display_order');

  // Insert default building options
  const insertOption = db.prepare(`
    INSERT OR IGNORE INTO location_options (category, value, display_order)
    VALUES (?, ?, ?)
  `);

  const defaultOptions = [
    // Buildings
    { category: 'building', value: 'SZH', order: 1 },
    { category: 'building', value: 'J1', order: 2 },
    { category: 'building', value: 'J2', order: 3 },
    { category: 'building', value: 'Student Hub', order: 4 },
    { category: 'building', value: 'Hostel', order: 5 },
    { category: 'building', value: 'Others', order: 99 },

    // Floors
    { category: 'floor', value: 'Ground', order: 1 },
    { category: 'floor', value: '1st', order: 2 },
    { category: 'floor', value: '2nd', order: 3 },
    { category: 'floor', value: '3rd', order: 4 },
    { category: 'floor', value: 'Others', order: 99 },

    // Sections
    { category: 'section', value: 'Male', order: 1 },
    { category: 'section', value: 'Female', order: 2 }
  ];

  for (const option of defaultOptions) {
    insertOption.run(option.category, option.value, option.order);
  }
  console.log('✓ Inserted default location options');

  console.log('Migration completed successfully!');
}

/**
 * Rollback migration (optional - for development)
 */
export function down() {
  console.log('Rolling back migration: Remove location_options table...');
  db.exec('DROP TABLE IF EXISTS location_options');
  console.log('✓ Dropped location_options table');
}

// Auto-run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  up();
}
