/**
 * Seed script to create the initial admin user
 *
 * Usage: node server/seeds/createAdmin.js [employee_id]
 *
 * If employee_id is provided, links that employee as admin.
 * If not provided, lists available employees to choose from.
 */

import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', 'assets.db');

const db = new Database(dbPath);

function listEmployees() {
  const employees = db.prepare(`
    SELECT e.id, e.employee_id, e.employee_name, e.email
    FROM employees e
    LEFT JOIN users u ON e.id = u.employee_id
    WHERE u.id IS NULL
    ORDER BY e.id
    LIMIT 20
  `).all();

  if (employees.length === 0) {
    console.log('\nNo available employees found (all may already be linked to users).');

    // Check if any users exist
    const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (existingUsers.count > 0) {
      console.log(`\nExisting users: ${existingUsers.count}`);
      const users = db.prepare(`
        SELECT u.id, u.role, e.employee_name, e.email
        FROM users u
        JOIN employees e ON u.employee_id = e.id
      `).all();
      console.log('\nCurrent users:');
      users.forEach(u => {
        console.log(`  - ${u.employee_name} (${u.email}) - ${u.role}`);
      });
    }
    return;
  }

  console.log('\nAvailable employees to link as admin:\n');
  console.log('ID\tEmployee ID\tName\t\t\t\tEmail');
  console.log('-'.repeat(80));
  employees.forEach(emp => {
    const name = emp.employee_name?.substring(0, 25).padEnd(25) || 'N/A'.padEnd(25);
    console.log(`${emp.id}\t${emp.employee_id || 'N/A'}\t\t${name}\t${emp.email || 'N/A'}`);
  });
  console.log('\nUsage: node server/seeds/createAdmin.js <employee.id>');
  console.log('Example: node server/seeds/createAdmin.js 1');
}

function createAdmin(employeeId) {
  // Check if employee exists
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);

  if (!employee) {
    console.error(`\nError: Employee with ID ${employeeId} not found.`);
    listEmployees();
    process.exit(1);
  }

  // Check if employee already has a user account
  const existingUser = db.prepare('SELECT * FROM users WHERE employee_id = ?').get(employeeId);

  if (existingUser) {
    console.error(`\nError: Employee "${employee.employee_name}" already has a user account.`);
    console.log(`  Role: ${existingUser.role}`);
    console.log(`  Active: ${existingUser.is_active ? 'Yes' : 'No'}`);
    process.exit(1);
  }

  // Create admin user
  const result = db.prepare(`
    INSERT INTO users (employee_id, role, is_active, created_at)
    VALUES (?, 'admin', 1, datetime('now'))
  `).run(employeeId);

  console.log('\n✓ Admin user created successfully!');
  console.log(`  User ID: ${result.lastInsertRowid}`);
  console.log(`  Name: ${employee.employee_name}`);
  console.log(`  Email: ${employee.email}`);
  console.log(`  Employee ID: ${employee.employee_id}`);
  console.log(`  Role: admin`);
  console.log('\nYou can now login using the Employee ID and OTP sent to the email.');
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  listEmployees();
} else {
  const employeeId = parseInt(args[0], 10);
  if (isNaN(employeeId)) {
    console.error('Error: Please provide a valid employee ID (number).');
    process.exit(1);
  }
  createAdmin(employeeId);
}

db.close();
