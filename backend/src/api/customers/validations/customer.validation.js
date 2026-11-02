import { body, param, query } from 'express-validator';

// Validation rules for customer registration (BE-016)
export const createCustomerValidation = [
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name cannot exceed 100 characters'),

  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name cannot exceed 100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .isLength({ min: 7, max: 32 })
    .withMessage('Phone number must be between 7 and 32 characters'),

  body('active').optional().isBoolean().withMessage('Active must be a boolean value'),
];

// Validation rules for customer listing & search (BE-017)
export const listCustomersValidation = [
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
    .isLength({ max: 100 })
    .withMessage('Search cannot exceed 100 characters'),

  query('active').optional().isBoolean().withMessage('Active must be a boolean value'),

  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
];

// Validation rules for retrieving a customer profile (BE-018)
export const getCustomerValidation = [
  param('customer_id').isInt({ min: 1 }).withMessage('Customer ID must be a positive integer'),
];

// Validation rules for updating or deactivating a customer (BE-019)
export const updateCustomerValidation = [
  param('customer_id').isInt({ min: 1 }).withMessage('Customer ID must be a positive integer'),

  body('first_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('First name cannot exceed 100 characters'),

  body('last_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Last name cannot exceed 100 characters'),

  body('email')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Email cannot be empty')
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone cannot be empty')
    .isLength({ min: 7, max: 32 })
    .withMessage('Phone number must be between 7 and 32 characters'),

  body('active').optional().isBoolean().withMessage('Active must be a boolean value'),

  body().custom((value, { req }) => {
    const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'active'];
    const keys = Object.keys(req.body || {});

    if (keys.length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    const unknownFields = keys.filter((key) => !allowedFields.includes(key));
    if (unknownFields.length > 0) {
      throw new Error(`Unknown fields are not allowed: ${unknownFields.join(', ')}`);
    }

    return true;
  }),
];