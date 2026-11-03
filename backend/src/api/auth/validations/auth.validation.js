import { body } from 'express-validator';
import { validationHandler } from '../../../middleware/validation-handler.js';
import {
  rejectUnknownBodyFields,
  rejectRequestBody,
  emailField,
} from '../../../middleware/validators.js';

export const loginValidation = [
  rejectUnknownBodyFields(['email', 'password']),
  emailField('email'),
  body('password')
    .isString()
    .withMessage('Password is required')
    .notEmpty()
    .withMessage('Password is required'),
  validationHandler,
];

export const logoutValidation = [rejectRequestBody];

export const forgotPasswordValidation = [
  rejectUnknownBodyFields(['email']),
  emailField('email'),
  validationHandler,
];
