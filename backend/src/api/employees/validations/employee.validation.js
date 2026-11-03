import { validationHandler } from '../../../middleware/validation-handler.js';
import {
  rejectUnknownBodyFields,
  emailField,
  passwordField,
  nameField,
  phoneField,
  roleIdField,
  booleanField,
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
