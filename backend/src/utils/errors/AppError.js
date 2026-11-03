import { ERROR_CODES } from '../../constants/error-codes.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, data = null, code = ERROR_CODES.INTERNAL_ERROR) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.data = data;
    this.code = code;
    this.isOperational = true;
  }
}
