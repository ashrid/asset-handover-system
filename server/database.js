import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'assets.db'));
db.pragma('journal_mode = WAL');

export function initDatabase() {
  // Assets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_code TEXT NOT NULL UNIQUE,
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
      status TEXT,
      unit_cost REAL,
      warranty_start_date TEXT,
      supplier_vendor TEXT,
      manufacturer TEXT,
      lpo_voucher_no TEXT,
      invoice_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Employees table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      employee_id TEXT,
      email TEXT NOT NULL,
      office_college TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Asset assignments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS asset_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      pdf_sent BOOLEAN DEFAULT 0,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )
  `);

  // Assignment items table (many-to-many between assignments and assets)
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignment_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
      FOREIGN KEY (assignment_id) REFERENCES asset_assignments(id),
      FOREIGN KEY (asset_id) REFERENCES assets(id)
    )
  `);

  console.log('Database initialized successfully');
}

export default db;
