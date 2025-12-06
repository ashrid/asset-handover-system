import express from 'express';
import db from '../database.js';
import { employeeValidation } from '../middleware/validation.js';

const router = express.Router();

// Get all employees
router.get('/', (req, res) => {
  try {
    const employees = db.prepare('SELECT * FROM employees ORDER BY created_at DESC').all();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single employee
router.get('/:id', (req, res) => {
  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create employee
router.post('/', employeeValidation.create, (req, res) => {
  try {
    const { employee_name, employee_id, email, office_college } = req.body;

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

// Update employee
router.put('/:id', employeeValidation.update, (req, res) => {
  try {
    const { employee_name, employee_id, email, office_college } = req.body;

    const stmt = db.prepare(`
      UPDATE employees SET
        employee_name = ?, employee_id = ?, email = ?, office_college = ?
      WHERE id = ?
    `);

    const result = stmt.run(employee_name, employee_id, email, office_college, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const updatedEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    res.json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete employee
router.delete('/:id', employeeValidation.delete, (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
