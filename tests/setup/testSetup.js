import { beforeAll, afterAll, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test database path
const TEST_DB_PATH = path.join(__dirname, '../test.db');

// Store original database reference
let originalDb = null;

/**
 * Initialize test database with schema
 */
export function initTestDatabase() {
  // Remove existing test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  const db = new Database(TEST_DB_PATH);

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_code TEXT UNIQUE NOT NULL,
      asset_type TEXT NOT NULL,
      description TEXT,
      model TEXT,
      serial_number TEXT,
      asset_category_1 TEXT,
      asset_category_2 TEXT,
      asset_category_3 TEXT,
      asset_category_4 TEXT,
      asset_location_1 TEXT,
      asset_location_2 TEXT,
      asset_location_3 TEXT,
      asset_location_4 TEXT,
      status TEXT DEFAULT 'Available',
      unit_cost REAL,
      warranty_start_date TEXT,
      supplier_vendor TEXT,
      manufacturer TEXT,
      lpo_voucher_no TEXT,
      invoice_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      employee_id TEXT,
      email TEXT NOT NULL,
      office_college TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      employee_name TEXT,
      employee_id_number TEXT,
      email TEXT,
      office_college TEXT,
      backup_email TEXT,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      pdf_sent INTEGER DEFAULT 0,
      signature_token TEXT UNIQUE,
      signature_data TEXT,
      signature_date DATETIME,
      signed_by_email TEXT,
      is_signed INTEGER DEFAULT 0,
      is_disputed INTEGER DEFAULT 0,
      dispute_reason TEXT,
      location_building TEXT,
      location_floor TEXT,
      location_section TEXT,
      device_type TEXT,
      token_expires_at DATETIME,
      last_reminder_sent DATETIME,
      reminder_count INTEGER DEFAULT 0,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS assignment_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER,
      asset_id INTEGER,
      FOREIGN KEY (assignment_id) REFERENCES asset_assignments(id),
      FOREIGN KEY (asset_id) REFERENCES assets(id)
    );
  `);

  return db;
}

/**
 * Get test database instance
 */
export function getTestDb() {
  return new Database(TEST_DB_PATH);
}

/**
 * Clear all tables
 */
export function clearTables(db) {
  db.exec(`
    DELETE FROM assignment_items;
    DELETE FROM asset_assignments;
    DELETE FROM employees;
    DELETE FROM assets;
  `);
}

/**
 * Insert test fixtures
 */
export function seedTestData(db) {
  // Insert test assets
  const insertAsset = db.prepare(`
    INSERT INTO assets (asset_code, asset_type, description, status)
    VALUES (?, ?, ?, ?)
  `);

  insertAsset.run('TEST-001', 'Laptop', 'Test Laptop 1', 'Available');
  insertAsset.run('TEST-002', 'Monitor', 'Test Monitor 1', 'Available');
  insertAsset.run('TEST-003', 'Keyboard', 'Test Keyboard 1', 'Available');

  // Insert test employee
  const insertEmployee = db.prepare(`
    INSERT INTO employees (employee_name, employee_id, email, office_college)
    VALUES (?, ?, ?, ?)
  `);

  insertEmployee.run('Test User', 'EMP001', 'test@example.com', 'IT Department');

  return {
    assets: db.prepare('SELECT * FROM assets').all(),
    employees: db.prepare('SELECT * FROM employees').all()
  };
}

// Export test database path for other modules
export { TEST_DB_PATH };
