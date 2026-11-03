import { body, param, query } from 'express-validator';
import { BadRequestError } from '../utils/errors/index.js';
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '../shared/auth/passwords.js';

export function rejectUnknownBodyFields(allowedFields) {
  return function checkBodyFields(req, res, next) {
    const bodyIsObject = req.body && typeof req.body === 'object' && !Array.isArray(req.body);
    if (!bodyIsObject) return next(new BadRequestError('Request body must be a JSON object'));
    const unknownFields = Object.keys(req.body).filter((key) => !allowedFields.includes(key));
    if (unknownFields.length) {
      const errors = {};
      for (const field of unknownFields) errors[field] = 'Unknown field';
      return next(new BadRequestError('Validation failed', { data: { errors } }));
    }
    next();
  };
}

export function rejectUnknownQueryFields(allowedFields) {
  return function checkQueryFields(req, res, next) {
    const unknownFields = Object.keys(req.query).filter((key) => !allowedFields.includes(key));
    if (unknownFields.length) {
      const errors = {};
      for (const field of unknownFields) errors[field] = 'Unknown query parameter';
      return next(new BadRequestError('Validation failed', { data: { errors } }));
    }
    next();
  };
}

export function requireAtLeastOneBodyField(req, res, next) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new BadRequestError('Provide at least one field to update'));
  }
  next();
}

export function rejectRequestBody(req, res, next) {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return next(new BadRequestError('This request must not include a body'));
  }
  next();
}

export const emailField = (fieldName = 'email') =>
  body(fieldName)
    .isString()
    .withMessage('Enter a valid email address')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address')
    .isLength({ max: 254 })
    .withMessage('Email must be at most 254 characters')
    .toLowerCase();

export const passwordField = (fieldName) =>
  body(fieldName)
    .isString()
    .withMessage('Password is required')
    .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
    .withMessage(
      `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`,
    );

export const nameField = (fieldName) =>
  body(fieldName)
    .isString()
    .withMessage('Must be text')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Must be between 1 and 100 characters');

export const phoneField = (fieldName = 'phone') =>
  body(fieldName)
    .isString()
    .withMessage('Must be text')
    .trim()
    .isLength({ min: 1, max: 32 })
    .withMessage('Must be between 1 and 32 characters');

export const roleIdField = (fieldName = 'role_id') =>
  body(fieldName).isInt({ min: 1, max: 3 }).withMessage('Role must be 1, 2 or 3').toInt();

export const booleanField = (fieldName) =>
  body(fieldName).isBoolean({ strict: true }).withMessage('Must be true or false');

export const positiveIdParam = (paramName) =>
  param(paramName).isInt({ min: 1 }).withMessage('Must be a positive integer').toInt();

export const queryBooleanField = (fieldName) =>
  query(fieldName)
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Must be true or false')
    .customSanitizer((value) => value === 'true');

export const paginationQueryFields = () => [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
    .toInt(),
];

export const searchQueryField = () =>
  query('search')
    .optional()
    .isString()
    .withMessage('search must be text')
    .trim()
    .isLength({ max: 100 })
    .withMessage('search must be at most 100 characters');
