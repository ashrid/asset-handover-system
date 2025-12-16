import { body, param, query, validationResult } from 'express-validator';
import { createModuleLogger } from '../services/logger.js';

const logger = createModuleLogger('validation');

/**
 * Validation result handler middleware
 * Returns 400 with validation errors if any exist
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn({
      requestId: req.id,
      errors: errors.array(),
      path: req.path
    }, 'Validation failed');

    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      }
    });
  }
  next();
};

/**
 * Sanitize and trim string inputs
 */
const sanitizeString = (field) => body(field).optional().trim().escape();

/**
 * Common validation rules
 */
export const commonValidators = {
  // ID parameter validation
  idParam: param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),

  // Token parameter validation
  tokenParam: param('token')
    .isLength({ min: 20, max: 50 })
    .withMessage('Invalid token format')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Token contains invalid characters'),

  // Email validation
  email: (field = 'email') => body(field)
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),

  // Optional email validation
  optionalEmail: (field) => body(field)
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),

  // Pagination
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ]
};

/**
 * Asset validation schemas
 */
export const assetValidation = {
  create: [
    body('asset_code')
      .notEmpty().withMessage('Asset code is required')
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Asset code must be between 1 and 100 characters')
      .matches(/^[A-Za-z0-9\-_/]+$/).withMessage('Asset code can only contain letters, numbers, hyphens, underscores, and slashes'),

    body('asset_type')
      .notEmpty().withMessage('Asset type is required')
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Asset type must be between 1 and 100 characters'),

    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),

    body('model')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Model must be less than 100 characters'),

    body('serial_number')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Serial number must be less than 100 characters'),

    body('unit_cost')
      .optional()
      .isFloat({ min: 0 }).withMessage('Unit cost must be a positive number'),

    body('status')
      .optional()
      .isIn(['Available', 'Assigned', 'Maintenance', 'Retired'])
      .withMessage('Invalid status value'),

    handleValidationErrors
  ],

  update: [
    commonValidators.idParam,

    body('asset_code')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Asset code must be between 1 and 100 characters')
      .matches(/^[A-Za-z0-9\-_/]+$/).withMessage('Asset code can only contain letters, numbers, hyphens, underscores, and slashes'),

    body('asset_type')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Asset type must be between 1 and 100 characters'),

    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),

    body('unit_cost')
      .optional()
      .isFloat({ min: 0 }).withMessage('Unit cost must be a positive number'),

    handleValidationErrors
  ],

  delete: [
    commonValidators.idParam,
    handleValidationErrors
  ]
};

/**
 * Employee validation schemas
 */
export const employeeValidation = {
  create: [
    body('employee_name')
      .notEmpty().withMessage('Employee name is required')
      .trim()
      .isLength({ min: 2, max: 200 }).withMessage('Employee name must be between 2 and 200 characters'),

    body('employee_id')
      .notEmpty().withMessage('Employee ID is required')
      .trim()
      .isLength({ min: 1, max: 50 }).withMessage('Employee ID must be between 1 and 50 characters'),

    commonValidators.email('email'),

    body('office_college')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Office/College must be less than 200 characters'),

    handleValidationErrors
  ],

  update: [
    commonValidators.idParam,

    body('employee_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 }).withMessage('Employee name must be between 2 and 200 characters'),

    body('employee_id')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 }).withMessage('Employee ID must be between 1 and 50 characters'),

    commonValidators.optionalEmail('email'),

    body('office_college')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Office/College must be less than 200 characters'),

    handleValidationErrors
  ],

  delete: [
    commonValidators.idParam,
    handleValidationErrors
  ]
};

/**
 * Handover validation schemas
 */
export const handoverValidation = {
  create: [
    body('employee_name')
      .notEmpty().withMessage('Employee name is required')
      .trim()
      .isLength({ min: 2, max: 200 }).withMessage('Employee name must be between 2 and 200 characters'),

    body('employee_id')
      .notEmpty().withMessage('Employee ID is required')
      .trim()
      .isLength({ min: 1, max: 50 }).withMessage('Employee ID must be between 1 and 50 characters'),

    commonValidators.email('email'),
    commonValidators.optionalEmail('backup_email'),

    body('office_college')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Office/College must be less than 200 characters'),

    body('asset_ids')
      .isArray({ min: 1 }).withMessage('At least one asset must be selected')
      .custom((value) => {
        if (!value.every(id => Number.isInteger(id) && id > 0)) {
          throw new Error('All asset IDs must be positive integers');
        }
        return true;
      }),

    handleValidationErrors
  ],

  updateAssets: [
    commonValidators.idParam,

    body('asset_ids')
      .isArray({ min: 1 }).withMessage('At least one asset must be selected')
      .custom((value) => {
        if (!value.every(id => Number.isInteger(id) && id > 0)) {
          throw new Error('All asset IDs must be positive integers');
        }
        return true;
      }),

    body('send_notification')
      .optional()
      .isBoolean().withMessage('send_notification must be a boolean'),

    handleValidationErrors
  ],

  submitSignature: [
    commonValidators.tokenParam,

    body('signature_data')
      .notEmpty().withMessage('Signature is required')
      .isString()
      .custom((value) => {
        // Check if it's a valid base64 data URL
        if (!value.startsWith('data:image/')) {
          throw new Error('Invalid signature format');
        }
        // Check size (max ~500KB for signature)
        if (value.length > 700000) {
          throw new Error('Signature data too large');
        }
        return true;
      }),

    body('location_building')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Building must be less than 100 characters'),

    body('location_floor')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Floor must be less than 50 characters'),

    body('location_section')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Section must be less than 100 characters'),

    body('device_type')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Device type must be less than 100 characters'),

    handleValidationErrors
  ],

  submitDispute: [
    commonValidators.tokenParam,

    body('dispute_reason')
      .notEmpty().withMessage('Dispute reason is required')
      .trim()
      .isLength({ min: 10, max: 1000 }).withMessage('Dispute reason must be between 10 and 1000 characters'),

    handleValidationErrors
  ],

  resend: [
    commonValidators.idParam,
    handleValidationErrors
  ],

  transfer: [
    commonValidators.idParam,

    body('new_employee_name')
      .notEmpty().withMessage('New employee name is required')
      .trim()
      .isLength({ min: 2, max: 200 }).withMessage('Employee name must be between 2 and 200 characters'),

    body('new_employee_id')
      .notEmpty().withMessage('New employee ID is required')
      .trim()
      .isLength({ min: 1, max: 50 }).withMessage('Employee ID must be between 1 and 50 characters'),

    body('new_email')
      .notEmpty().withMessage('New employee email is required')
      .isEmail().withMessage('Invalid email address')
      .normalizeEmail()
      .isLength({ max: 255 }).withMessage('Email must be less than 255 characters'),

    commonValidators.optionalEmail('new_backup_email'),

    body('new_office_college')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Office/College must be less than 200 characters'),

    body('asset_ids')
      .isArray({ min: 1 }).withMessage('At least one asset must be selected for transfer')
      .custom((value) => {
        if (!value.every(id => Number.isInteger(id) && id > 0)) {
          throw new Error('All asset IDs must be positive integers');
        }
        return true;
      }),

    body('transfer_reason')
      .notEmpty().withMessage('Transfer reason is required')
      .trim()
      .isLength({ min: 5, max: 500 }).withMessage('Transfer reason must be between 5 and 500 characters'),

    body('notify_original_employee')
      .optional()
      .isBoolean().withMessage('notify_original_employee must be a boolean'),

    handleValidationErrors
  ]
};

/**
 * Auth validation schemas
 */
export const authValidation = {
  requestOTP: [
    body('employee_id')
      .notEmpty().withMessage('Employee ID is required')
      .trim()
      .isLength({ min: 1, max: 50 }).withMessage('Employee ID must be between 1 and 50 characters'),

    handleValidationErrors
  ],

  verifyOTP: [
    body('employee_id')
      .notEmpty().withMessage('Employee ID is required')
      .trim()
      .isLength({ min: 1, max: 50 }).withMessage('Employee ID must be between 1 and 50 characters'),

    body('otp_code')
      .notEmpty().withMessage('OTP code is required')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
      .matches(/^\d{6}$/).withMessage('OTP must contain only numbers'),

    handleValidationErrors
  ]
};

/**
 * User management validation schemas
 */
export const userValidation = {
  getUser: [
    commonValidators.idParam,
    handleValidationErrors
  ],

  createUser: [
    body('employee_id')
      .notEmpty().withMessage('Employee ID is required')
      .isInt({ min: 1 }).withMessage('Employee ID must be a positive integer'),

    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(['admin', 'staff', 'viewer']).withMessage('Invalid role. Must be admin, staff, or viewer'),

    handleValidationErrors
  ],

  updateUser: [
    commonValidators.idParam,

    body('role')
      .optional()
      .isIn(['admin', 'staff', 'viewer']).withMessage('Invalid role. Must be admin, staff, or viewer'),

    body('is_active')
      .optional()
      .isBoolean().withMessage('is_active must be a boolean'),

    handleValidationErrors
  ],

  deleteUser: [
    commonValidators.idParam,
    handleValidationErrors
  ]
};

export default {
  handleValidationErrors,
  commonValidators,
  assetValidation,
  employeeValidation,
  handoverValidation,
  authValidation,
  userValidation
};
