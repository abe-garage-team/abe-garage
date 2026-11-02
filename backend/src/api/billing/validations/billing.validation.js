import { param } from 'express-validator';
import { BadRequestError } from '../../../utils/errors/index.js';
import { validationHandler } from '../../../middleware/validation-handler.js';
import { rejectUnknownQueryFields } from '../../../middleware/validators.js';

function noInvoiceBody(req, _res, next) {
  // Reject even {} and unparsed content types: issuance takes no client financial data.
  if (Number(req.get('Content-Length') || 0) > 0 || req.get('Transfer-Encoding')) {
    return next(new BadRequestError('This request must not include a body'));
  }
  next();
}

export const issueInvoiceValidation = [
  noInvoiceBody,
  rejectUnknownQueryFields([]),
  param('order_id')
    .isInt({ min: 1, max: 4294967295 })
    .withMessage('Order ID must be a positive integer')
    .bail()
    .toInt(),
  validationHandler,
];
