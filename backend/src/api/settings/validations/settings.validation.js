import { body } from 'express-validator';
import { validationHandler } from '../../../middleware/validation-handler.js';
import {
  rejectUnknownBodyFields,
  requireAtLeastOneBodyField,
  emailField,
  phoneField,
} from '../../../middleware/validators.js';

const textField = (fieldName, max) =>
  body(fieldName)
    .isString()
    .withMessage('Must be text')
    .trim()
    .isLength({ min: 1, max })
    .withMessage(`Must be between 1 and ${max} characters`);

export const updateSettingsValidation = [
  rejectUnknownBodyFields(['name', 'address', 'phone', 'email', 'vat_rate']),
  requireAtLeastOneBodyField,
  textField('name', 150).optional(),
  textField('address', 500).optional(),
  phoneField('phone').optional(),
  emailField('email').optional(),
  body('vat_rate')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('VAT rate must be a number with at most 2 decimals')
    .isFloat({ min: 0, max: 100 })
    .withMessage('VAT rate must be between 0 and 100')
    .toFloat(),
  validationHandler,
];
