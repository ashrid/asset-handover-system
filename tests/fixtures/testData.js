/**
 * Test fixtures for unit and integration tests
 */

export const validAsset = {
  asset_code: 'ASSET-001',
  asset_type: 'Laptop',
  description: 'Dell Latitude 5520',
  model: 'Latitude 5520',
  serial_number: 'SN123456789',
  status: 'Available',
  unit_cost: 1500.00,
  manufacturer: 'Dell'
};

export const invalidAsset = {
  // Missing required asset_code
  asset_type: 'Laptop',
  description: 'Invalid asset'
};

export const validEmployee = {
  employee_name: 'John Doe',
  employee_id: 'EMP001',
  email: 'john.doe@example.com',
  office_college: 'College of IT'
};

export const invalidEmployee = {
  // Missing required fields
  employee_name: 'J' // Too short
};

export const validHandover = {
  employee_name: 'Jane Smith',
  employee_id: 'EMP002',
  email: 'jane.smith@example.com',
  office_college: 'College of Engineering',
  asset_ids: [1, 2]
};

export const validHandoverWithBackup = {
  employee_name: 'Jane Smith',
  employee_id: 'EMP002',
  email: 'jane.smith@example.com',
  backup_email: 'backup@example.com',
  office_college: 'College of Engineering',
  asset_ids: [1, 2]
};

export const validSignature = {
  signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  location_building: 'Main Building',
  location_floor: '2nd Floor',
  location_section: 'IT Department',
  device_type: 'Desktop'
};

export const invalidSignature = {
  // Missing signature_data
  location_building: 'Main Building'
};

export const validDispute = {
  dispute_reason: 'I did not receive these assets. Please verify the assignment.'
};

export const invalidDispute = {
  dispute_reason: 'Too short' // Less than 10 characters
};

export const multipleAssets = [
  {
    asset_code: 'BULK-001',
    asset_type: 'Laptop',
    description: 'Bulk Laptop 1'
  },
  {
    asset_code: 'BULK-002',
    asset_type: 'Monitor',
    description: 'Bulk Monitor 1'
  },
  {
    asset_code: 'BULK-003',
    asset_type: 'Keyboard',
    description: 'Bulk Keyboard 1'
  }
];

// Generate a valid token-like string
export const generateTestToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Date helpers
export const futureDate = (days = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const pastDate = (days = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};
