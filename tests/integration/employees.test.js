import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, cleanupTestDb, closeTestDb } from '../setup/testApp.js';
import { validEmployee } from '../fixtures/testData.js';

describe('Employees API', () => {
  let app;
  let db;

  beforeAll(async () => {
    const result = await createTestApp();
    app = result.app;
    db = result.db;
  });

  afterAll(() => {
    closeTestDb(db);
  });

  beforeEach(() => {
    cleanupTestDb(db);
  });

  describe('GET /api/employees', () => {
    it('should return empty array when no employees exist', async () => {
      const response = await request(app)
        .get('/api/employees')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all employees', async () => {
      // Insert test employee
      db.prepare(`
        INSERT INTO employees (employee_name, employee_id, email, office_college)
        VALUES (?, ?, ?, ?)
      `).run('John Doe', 'EMP001', 'john@example.com', 'IT Department');

      const response = await request(app)
        .get('/api/employees')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].employee_name).toBe('John Doe');
    });

    it('should return multiple employees', async () => {
      const insert = db.prepare(`
        INSERT INTO employees (employee_name, employee_id, email)
        VALUES (?, ?, ?)
      `);
      insert.run('First', 'EMP001', 'first@example.com');
      insert.run('Second', 'EMP002', 'second@example.com');

      const response = await request(app)
        .get('/api/employees')
        .expect(200);

      expect(response.body).toHaveLength(2);
      // Check both employees exist
      const names = response.body.map(e => e.employee_name);
      expect(names).toContain('First');
      expect(names).toContain('Second');
    });
  });

  describe('POST /api/employees', () => {
    it('should create a new employee', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send(validEmployee)
        .expect(201);

      expect(response.body.employee_name).toBe(validEmployee.employee_name);
      expect(response.body.email).toBe(validEmployee.email);
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 when employee_name is missing', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send({ employee_name: 'John Doe' })
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should allow employee without employee_id', async () => {
      const employeeWithoutId = {
        employee_name: 'No ID Employee',
        email: 'noid@example.com'
      };

      const response = await request(app)
        .post('/api/employees')
        .send(employeeWithoutId)
        .expect(201);

      expect(response.body.employee_name).toBe('No ID Employee');
      expect(response.body.employee_id).toBeNull();
    });

    it('should allow employee without office_college', async () => {
      const employeeWithoutOffice = {
        employee_name: 'No Office',
        employee_id: 'EMP003',
        email: 'nooffice@example.com'
      };

      const response = await request(app)
        .post('/api/employees')
        .send(employeeWithoutOffice)
        .expect(201);

      expect(response.body.office_college).toBeNull();
    });
  });

  describe('Employee Data Integrity', () => {
    it('should store all employee fields correctly', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send(validEmployee)
        .expect(201);

      const storedEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(response.body.id);

      expect(storedEmployee.employee_name).toBe(validEmployee.employee_name);
      expect(storedEmployee.employee_id).toBe(validEmployee.employee_id);
      expect(storedEmployee.email).toBe(validEmployee.email);
      expect(storedEmployee.office_college).toBe(validEmployee.office_college);
      expect(storedEmployee.created_at).toBeDefined();
    });

    it('should allow duplicate emails', async () => {
      // First employee
      await request(app)
        .post('/api/employees')
        .send(validEmployee)
        .expect(201);

      // Second employee with same email (different name)
      const duplicateEmailEmployee = {
        ...validEmployee,
        employee_name: 'Different Name',
        employee_id: 'EMP999'
      };

      const response = await request(app)
        .post('/api/employees')
        .send(duplicateEmailEmployee)
        .expect(201);

      expect(response.body.employee_name).toBe('Different Name');
    });
  });
});
