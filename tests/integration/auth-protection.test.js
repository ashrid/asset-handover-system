import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Import the actual routes with authentication
import assetsRouter from '../../server/routes/assets.js';
import employeesRouter from '../../server/routes/employees.js';
import dashboardRouter from '../../server/routes/dashboard.js';
import handoverRouter from '../../server/routes/handover.js';
import locationsRouter from '../../server/routes/locations.js';

// Test JWT secret (must match tokenService default)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars';

/**
 * Generate a test JWT token matching the tokenService format
 */
function generateTestToken(payload = {}) {
  const defaultPayload = {
    userId: 1,
    employeeId: 'EMP001',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
    type: 'access',  // Required by verifyAccessToken
    ...payload
  };
  return jwt.sign(defaultPayload, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Create a minimal test app with actual routes
 */
function createAuthTestApp() {
  const app = express();
  app.use(express.json());

  // Mount routes (these have auth middleware)
  app.use('/api/assets', assetsRouter);
  app.use('/api/employees', employeesRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/handover', handoverRouter);
  app.use('/api/locations', locationsRouter);

  return app;
}

describe('API Route Protection', () => {
  let app;
  let adminToken;
  let staffToken;
  let viewerToken;

  beforeAll(() => {
    app = createAuthTestApp();
    adminToken = generateTestToken({ role: 'admin' });
    staffToken = generateTestToken({ role: 'staff' });
    viewerToken = generateTestToken({ role: 'viewer' });
  });

  describe('Authentication Required (401)', () => {
    it('should return 401 for /api/assets without token', async () => {
      const response = await request(app)
        .get('/api/assets')
        .expect(401);

      expect(response.body.error.code).toBe('AUTH_REQUIRED');
    });

    it('should return 401 for /api/employees without token', async () => {
      const response = await request(app)
        .get('/api/employees')
        .expect(401);

      expect(response.body.error.code).toBe('AUTH_REQUIRED');
    });

    it('should return 401 for /api/dashboard/stats without token', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(401);

      expect(response.body.error.code).toBe('AUTH_REQUIRED');
    });

    it('should return 401 for /api/handover/assignments without token', async () => {
      const response = await request(app)
        .get('/api/handover/assignments')
        .expect(401);

      expect(response.body.error.code).toBe('AUTH_REQUIRED');
    });

    it('should return 401 for /api/locations/options without token', async () => {
      const response = await request(app)
        .get('/api/locations/options')
        .expect(401);

      expect(response.body.error.code).toBe('AUTH_REQUIRED');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/assets')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 1, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );

      const response = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Role-Based Access Control (403)', () => {
    it('should return 403 for viewer accessing /api/assets', async () => {
      const response = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should return 403 for viewer accessing /api/employees', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should return 403 for viewer creating handover', async () => {
      const response = await request(app)
        .post('/api/handover')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          employee_name: 'Test',
          email: 'test@test.com',
          asset_ids: [1]
        })
        .expect(403);

      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should return 403 for viewer adding location option', async () => {
      const response = await request(app)
        .post('/api/locations/options')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ category: 'building', value: 'Test Building' })
        .expect(403);

      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });
  });

  describe('Authorized Access (2xx)', () => {
    it('should allow admin to access /api/assets', async () => {
      const response = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should not be 401 or 403
      expect([401, 403]).not.toContain(response.status);
    });

    it('should allow staff to access /api/assets', async () => {
      const response = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${staffToken}`);

      expect([401, 403]).not.toContain(response.status);
    });

    it('should allow viewer to access /api/dashboard/stats', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([401, 403]).not.toContain(response.status);
    });

    it('should allow viewer to access /api/handover/assignments', async () => {
      const response = await request(app)
        .get('/api/handover/assignments')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([401, 403]).not.toContain(response.status);
    });

    it('should allow admin to access /api/locations/options', async () => {
      const response = await request(app)
        .get('/api/locations/options')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([401, 403]).not.toContain(response.status);
    });
  });

  describe('Public Endpoints (No Auth Required)', () => {
    it('should allow access to /api/handover/sign/:token without auth', async () => {
      const response = await request(app)
        .get('/api/handover/sign/test-token-12345');

      // Should get 404 (token not found) not 401 (auth required)
      expect(response.status).toBe(404);
      expect(response.body.error).not.toMatch(/authentication/i);
    });

    it('should allow access to /api/handover/submit-signature/:token without auth', async () => {
      const response = await request(app)
        .post('/api/handover/submit-signature/test-token-12345')
        .send({ signature_data: 'data:image/png;base64,test' });

      // Should not get 401 (auth required) - validation or not found errors are fine
      expect(response.status).not.toBe(401);
    });

    it('should allow access to /api/handover/dispute/:token without auth', async () => {
      const response = await request(app)
        .post('/api/handover/dispute/test-token-12345')
        .send({ dispute_reason: 'Test dispute' });

      // Should not get 401 (auth required) - validation or not found errors are fine
      expect(response.status).not.toBe(401);
    });
  });
});
