import { body, query } from 'express-validator';

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

  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean value'),
];

// Validation rules for customer listing & search (BE-017)
export const listCustomersValidation = [
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
    .isLength({ max: 100 })
    .withMessage('Search cannot exceed 100 characters'),

  query('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean value'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
];