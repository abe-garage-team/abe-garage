import { validationResult } from 'express-validator';
import { BadRequestError } from '../utils/errors/index.js';

export function validationHandler(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = {};
  for (const error of result.array({ onlyFirstError: true })) {
    const fieldName = error.path || 'request';
    errors[fieldName] = error.msg;
  }
  next(new BadRequestError('Validation failed', { data: { errors } }));
}
