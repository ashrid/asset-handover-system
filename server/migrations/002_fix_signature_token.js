import db from '../database.js';

console.log('Fixing signature_token column...');

try {
  db.exec('ALTER TABLE asset_assignments ADD COLUMN signature_token TEXT');
  console.log('✓ Added column: signature_token');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('→ Column signature_token already exists');
  } else {
    console.error('✗ Error:', error.message);
  }
}

try {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_signature_token ON asset_assignments(signature_token)');
  console.log('✓ Created unique index on signature_token');
} catch (error) {
  console.error('✗ Error creating index:', error.message);
}

console.log('Done!');
