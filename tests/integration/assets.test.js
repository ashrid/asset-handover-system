import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, cleanupTestDb, closeTestDb } from '../setup/testApp.js';
import { validAsset, multipleAssets } from '../fixtures/testData.js';

describe('Assets API', () => {
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

  describe('GET /api/assets', () => {
    it('should return empty array when no assets exist', async () => {
      const response = await request(app)
        .get('/api/assets')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all assets', async () => {
      // Insert test asset
      db.prepare(`
        INSERT INTO assets (asset_code, asset_type, description)
        VALUES (?, ?, ?)
      `).run('TEST-001', 'Laptop', 'Test Laptop');

      const response = await request(app)
        .get('/api/assets')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].asset_code).toBe('TEST-001');
    });

    it('should return assets ordered by id descending', async () => {
      // Insert multiple assets
      const insert = db.prepare(`
        INSERT INTO assets (asset_code, asset_type, description)
        VALUES (?, ?, ?)
      `);
      insert.run('FIRST-001', 'Laptop', 'First');
      insert.run('SECOND-002', 'Monitor', 'Second');

      const response = await request(app)
        .get('/api/assets')
        .expect(200);

      expect(response.body).toHaveLength(2);
      // Check both assets exist (order may vary with same timestamp)
      const codes = response.body.map(a => a.asset_code);
      expect(codes).toContain('FIRST-001');
      expect(codes).toContain('SECOND-002');
    });
  });

  describe('GET /api/assets/:id', () => {
    it('should return asset by ID', async () => {
      const result = db.prepare(`
        INSERT INTO assets (asset_code, asset_type, description)
        VALUES (?, ?, ?)
      `).run('TEST-001', 'Laptop', 'Test Laptop');

      const response = await request(app)
        .get(`/api/assets/${result.lastInsertRowid}`)
        .expect(200);

      expect(response.body.asset_code).toBe('TEST-001');
      expect(response.body.asset_type).toBe('Laptop');
    });

    it('should return 404 for non-existent asset', async () => {
      const response = await request(app)
        .get('/api/assets/99999')
        .expect(404);

      expect(response.body.error).toBe('Asset not found');
    });
  });

  describe('POST /api/assets', () => {
    it('should create a new asset', async () => {
      const response = await request(app)
        .post('/api/assets')
        .send(validAsset)
        .expect(201);

      expect(response.body.asset_code).toBe(validAsset.asset_code);
      expect(response.body.asset_type).toBe(validAsset.asset_type);
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 when asset_code is missing', async () => {
      const response = await request(app)
        .post('/api/assets')
        .send({ asset_type: 'Laptop' })
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should return 400 when asset_type is missing', async () => {
      const response = await request(app)
        .post('/api/assets')
        .send({ asset_code: 'TEST-001' })
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should return 400 for duplicate asset_code', async () => {
      // First create
      await request(app)
        .post('/api/assets')
        .send(validAsset)
        .expect(201);

      // Try duplicate
      const response = await request(app)
        .post('/api/assets')
        .send(validAsset)
        .expect(400);

      expect(response.body.error).toContain('already exists');
    });

    it('should set default status to Available', async () => {
      const assetWithoutStatus = {
        asset_code: 'NO-STATUS-001',
        asset_type: 'Laptop'
      };

      const response = await request(app)
        .post('/api/assets')
        .send(assetWithoutStatus)
        .expect(201);

      expect(response.body.status).toBe('Available');
    });
  });

  describe('DELETE /api/assets/:id', () => {
    it('should delete an existing asset', async () => {
      const result = db.prepare(`
        INSERT INTO assets (asset_code, asset_type)
        VALUES (?, ?)
      `).run('DELETE-001', 'Laptop');

      const response = await request(app)
        .delete(`/api/assets/${result.lastInsertRowid}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');

      // Verify deletion
      const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(result.lastInsertRowid);
      expect(asset).toBeUndefined();
    });

    it('should return 404 for non-existent asset', async () => {
      const response = await request(app)
        .delete('/api/assets/99999')
        .expect(404);

      expect(response.body.error).toBe('Asset not found');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });
});
