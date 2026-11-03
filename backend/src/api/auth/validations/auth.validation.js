import { body } from 'express-validator';
import { validationHandler } from '../../../middleware/validation-handler.js';
import {
  rejectUnknownBodyFields,
  rejectRequestBody,
  emailField,
  passwordField,
} from '../../../middleware/validators.js';
import { TOKEN_PATTERN } from '../../../shared/auth/tokens.js';

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

export const resetPasswordValidation = [
  rejectUnknownBodyFields(['token', 'new_password']),
  body('token')
    .isString()
    .withMessage('Reset token is required')
    .matches(TOKEN_PATTERN)
    .withMessage('Invalid reset token'),
  passwordField('new_password'),
  validationHandler,
];

export const changePasswordValidation = [
  rejectUnknownBodyFields(['current_password', 'new_password']),
  body('current_password')
    .isString()
    .withMessage('Current password is required')
    .notEmpty()
    .withMessage('Current password is required'),
  passwordField('new_password'),
  validationHandler,
];
