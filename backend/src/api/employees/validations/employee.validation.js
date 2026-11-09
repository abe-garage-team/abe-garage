import { query } from 'express-validator';
import { validationHandler } from '../../../middleware/validation-handler.js';
import {
  rejectUnknownBodyFields,
  rejectUnknownQueryFields,
  requireAtLeastOneBodyField,
  rejectRequestBody,
  emailField,
  passwordField,
  nameField,
  phoneField,
  roleIdField,
  booleanField,
  queryBooleanField,
  paginationQueryFields,
  searchQueryField,
  positiveIdParam,
} from '../../../middleware/validators.js';

export const createEmployeeValidation = [
  rejectUnknownBodyFields([
    'first_name',
    'last_name',
    'email',
    'phone',
    'password',
    'role_id',
    'active',
  ]),
  nameField('first_name'),
  nameField('last_name'),
  emailField('email'),
  phoneField('phone'),
  passwordField('password'),
  roleIdField('role_id'),
  booleanField('active').optional(),
  validationHandler,
];

export const listEmployeesValidation = [
  rejectRequestBody,
  rejectUnknownQueryFields(['search', 'role_id', 'active', 'page', 'limit']),
  searchQueryField(),
  query('role_id')
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage('role_id must be 1, 2 or 3')
    .toInt(),
  queryBooleanField('active'),
  ...paginationQueryFields(),
  validationHandler,
];

export const getEmployeeValidation = [
  rejectRequestBody,
  positiveIdParam('employee_id'),
  validationHandler,
];

export const updateEmployeeValidation = [
  positiveIdParam('employee_id'),
  rejectUnknownBodyFields(['first_name', 'last_name', 'email', 'phone', 'role_id', 'active']),
  requireAtLeastOneBodyField,
  nameField('first_name').optional(),
  nameField('last_name').optional(),
  emailField('email').optional(),
  phoneField('phone').optional(),
  roleIdField('role_id').optional(),
  booleanField('active').optional(),
  validationHandler,
];
