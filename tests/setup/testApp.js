import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB_PATH = path.join(__dirname, '../test.db');

/**
 * Create a test Express app with routes
 * Uses a separate test database
 */
export async function createTestApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Create test database connection
  const db = new Database(TEST_DB_PATH);

  // Initialize tables if they don't exist
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

  // Attach db to app for route access
  app.locals.db = db;

  // Simple routes for testing (without validation middleware for simplicity)
  // Assets routes
  app.get('/api/assets', (req, res) => {
    const assets = db.prepare('SELECT * FROM assets ORDER BY created_at DESC').all();
    res.json(assets);
  });

  app.get('/api/assets/:id', (req, res) => {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  });

  app.post('/api/assets', (req, res) => {
    try {
      const { asset_code, asset_type, description, model, serial_number, status, unit_cost, manufacturer } = req.body;

      if (!asset_code || !asset_type) {
        return res.status(400).json({ error: 'Asset Code and Asset Type are required' });
      }

      const stmt = db.prepare(`
        INSERT INTO assets (asset_code, asset_type, description, model, serial_number, status, unit_cost, manufacturer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(asset_code, asset_type, description, model, serial_number, status || 'Available', unit_cost, manufacturer);
      const newAsset = db.prepare('SELECT * FROM assets WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(newAsset);
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'Asset Code already exists' });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.delete('/api/assets/:id', (req, res) => {
    const result = db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ message: 'Asset deleted successfully' });
  });

  // Employees routes
  app.get('/api/employees', (req, res) => {
    const employees = db.prepare('SELECT * FROM employees ORDER BY created_at DESC').all();
    res.json(employees);
  });

  app.post('/api/employees', (req, res) => {
    try {
      const { employee_name, employee_id, email, office_college } = req.body;

      if (!employee_name || !email) {
        return res.status(400).json({ error: 'Employee Name and Email are required' });
      }

      const stmt = db.prepare(`
        INSERT INTO employees (employee_name, employee_id, email, office_college)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(employee_name, employee_id, email, office_college);
      const newEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(newEmployee);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Test app error:', err);
    res.status(500).json({ error: err.message });
  });

  return { app, db };
}

/**
 * Clean up test database
 */
export function cleanupTestDb(db) {
  db.exec(`
    DELETE FROM assignment_items;
    DELETE FROM asset_assignments;
    DELETE FROM employees;
    DELETE FROM assets;
  `);
}

/**
 * Close database connection
 */
export function closeTestDb(db) {
  if (db) {
    db.close();
  }
}
