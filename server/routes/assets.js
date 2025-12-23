import express from 'express';
import db from '../database.js';
import { assetValidation } from '../middleware/validation.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All asset routes require authentication and staff/admin role
router.use(authenticateToken);
router.use(requireRole('admin', 'staff'));

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
router.post('/', assetValidation.create, (req, res) => {
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
router.put('/:id', assetValidation.update, (req, res) => {
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
router.delete('/:id', assetValidation.delete, (req, res) => {
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

// Bulk import assets from Excel
router.post('/bulk-import', (req, res) => {
  try {
    const { assets } = req.body;

    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ error: 'No assets provided for import' });
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

    const insertMany = db.transaction((assets) => {
      let successCount = 0;
      const errors = [];

      for (const [index, asset] of assets.entries()) {
        try {
          // Validate required fields
          if (!asset.asset_code || !asset.asset_type) {
            errors.push(`Row ${index + 1}: Missing required fields (asset_code or asset_type)`);
            continue;
          }

          // Map Excel column names to database column names
          stmt.run(
            asset.asset_code,
            asset.asset_type,
            asset.description || null,
            asset.model || null,
            asset.serial_number || null,
            asset.asset_category_1 || null,
            asset.asset_category_2 || null,
            asset.asset_category_3 || null,
            asset.asset_category_4 || null,
            asset.asset_location_1 || null,
            asset.asset_location_2 || null,
            asset.asset_location_3 || null,
            asset.asset_location_4 || null,
            asset.status || null,
            asset.unit_cost || null,
            asset.warranty_start_date || null,
            asset.supplier_vendor || null,
            asset.manufacturer || null,
            asset.lpo_voucher_no || null,
            asset.invoice_no || null
          );
          successCount++;
        } catch (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            errors.push(`Row ${index + 1}: Asset code '${asset.asset_code}' already exists`);
          } else {
            errors.push(`Row ${index + 1}: ${err.message}`);
          }
        }
      }

      return { successCount, errors };
    });

    const result = insertMany(assets);

    if (result.errors.length > 0 && result.successCount === 0) {
      return res.status(400).json({
        error: 'All imports failed',
        details: result.errors
      });
    }

    res.status(201).json({
      count: result.successCount,
      message: `Successfully imported ${result.successCount} asset${result.successCount !== 1 ? 's' : ''}`,
      errors: result.errors.length > 0 ? result.errors : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
