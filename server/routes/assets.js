import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get all assets
router.get('/', (req, res) => {
  try {
    const assets = db.prepare('SELECT * FROM assets ORDER BY created_at DESC').all();
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single asset
router.get('/:id', (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create asset
router.post('/', (req, res) => {
  try {
    const {
      asset_code,
      asset_type,
      description,
      model,
      serial_number,
      asset_category_1,
      asset_category_2,
      asset_category_3,
      asset_category_4,
      asset_location_1,
      asset_location_2,
      asset_location_3,
      asset_location_4,
      status,
      unit_cost,
      warranty_start_date,
      supplier_vendor,
      manufacturer,
      lpo_voucher_no,
      invoice_no
    } = req.body;

    if (!asset_code || !asset_type) {
      return res.status(400).json({ error: 'Asset Code and Asset Type are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO assets (
        asset_code, asset_type, description, model, serial_number,
        asset_category_1, asset_category_2, asset_category_3, asset_category_4,
        asset_location_1, asset_location_2, asset_location_3, asset_location_4,
        status, unit_cost, warranty_start_date, supplier_vendor, manufacturer,
        lpo_voucher_no, invoice_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      asset_code, asset_type, description, model, serial_number,
      asset_category_1, asset_category_2, asset_category_3, asset_category_4,
      asset_location_1, asset_location_2, asset_location_3, asset_location_4,
      status, unit_cost, warranty_start_date, supplier_vendor, manufacturer,
      lpo_voucher_no, invoice_no
    );

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

// Update asset
router.put('/:id', (req, res) => {
  try {
    const {
      asset_code,
      asset_type,
      description,
      model,
      serial_number,
      asset_category_1,
      asset_category_2,
      asset_category_3,
      asset_category_4,
      asset_location_1,
      asset_location_2,
      asset_location_3,
      asset_location_4,
      status,
      unit_cost,
      warranty_start_date,
      supplier_vendor,
      manufacturer,
      lpo_voucher_no,
      invoice_no
    } = req.body;

    const stmt = db.prepare(`
      UPDATE assets SET
        asset_code = ?, asset_type = ?, description = ?, model = ?, serial_number = ?,
        asset_category_1 = ?, asset_category_2 = ?, asset_category_3 = ?, asset_category_4 = ?,
        asset_location_1 = ?, asset_location_2 = ?, asset_location_3 = ?, asset_location_4 = ?,
        status = ?, unit_cost = ?, warranty_start_date = ?, supplier_vendor = ?, manufacturer = ?,
        lpo_voucher_no = ?, invoice_no = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      asset_code, asset_type, description, model, serial_number,
      asset_category_1, asset_category_2, asset_category_3, asset_category_4,
      asset_location_1, asset_location_2, asset_location_3, asset_location_4,
      status, unit_cost, warranty_start_date, supplier_vendor, manufacturer,
      lpo_voucher_no, invoice_no, req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const updatedAsset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    res.json(updatedAsset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete asset
router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM assets WHERE id = ?');
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
