import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get all location options (grouped by category)
router.get('/options', (req, res) => {
  try {
    const options = db.prepare(`
      SELECT id, category, value, display_order
      FROM location_options
      ORDER BY category, display_order, value
    `).all();

    // Group by category for easier frontend consumption
    const grouped = {
      building: [],
      floor: [],
      section: []
    };

    for (const option of options) {
      if (grouped[option.category]) {
        grouped[option.category].push(option);
      }
    }

    res.json(grouped);
  } catch (error) {
    console.error('Error fetching location options:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get options for a specific category
router.get('/options/:category', (req, res) => {
  try {
    const { category } = req.params;

    // Validate category
    if (!['building', 'floor', 'section'].includes(category)) {
      return res.status(400).json({
        error: 'Invalid category. Must be: building, floor, or section'
      });
    }

    const options = db.prepare(`
      SELECT id, category, value, display_order
      FROM location_options
      WHERE category = ?
      ORDER BY display_order, value
    `).all(category);

    res.json(options);
  } catch (error) {
    console.error('Error fetching location options:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add new location option
router.post('/options', (req, res) => {
  try {
    const { category, value } = req.body;

    // Validate required fields
    if (!category || !value) {
      return res.status(400).json({
        error: 'Category and value are required'
      });
    }

    // Validate category
    if (!['building', 'floor', 'section'].includes(category)) {
      return res.status(400).json({
        error: 'Invalid category. Must be: building, floor, or section'
      });
    }

    // Validate value is not empty
    if (!value.trim()) {
      return res.status(400).json({
        error: 'Value cannot be empty'
      });
    }

    // Get the max display_order for this category
    const maxOrder = db.prepare(`
      SELECT MAX(display_order) as max_order
      FROM location_options
      WHERE category = ?
    `).get(category);

    // New items get display_order = max + 1 (but before "Others" which is 99)
    const displayOrder = Math.min((maxOrder?.max_order || 0) + 1, 98);

    // Insert new option
    const insertStmt = db.prepare(`
      INSERT INTO location_options (category, value, display_order)
      VALUES (?, ?, ?)
    `);

    const result = insertStmt.run(category, value.trim(), displayOrder);

    // Return the newly created option
    const newOption = db.prepare(`
      SELECT id, category, value, display_order
      FROM location_options
      WHERE id = ?
    `).get(result.lastInsertRowid);

    res.json({
      message: 'Location option added successfully',
      option: newOption
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        error: 'This location option already exists'
      });
    }
    console.error('Error adding location option:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete location option (admin only)
router.delete('/options/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Check if option exists
    const option = db.prepare(`
      SELECT * FROM location_options WHERE id = ?
    `).get(id);

    if (!option) {
      return res.status(404).json({
        error: 'Location option not found'
      });
    }

    // Prevent deletion of "Others" option
    if (option.value === 'Others') {
      return res.status(403).json({
        error: 'Cannot delete "Others" option'
      });
    }

    // Delete the option
    const deleteStmt = db.prepare(`
      DELETE FROM location_options WHERE id = ?
    `);

    deleteStmt.run(id);

    res.json({
      message: 'Location option deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location option:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
