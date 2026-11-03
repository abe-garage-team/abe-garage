import { AppError } from './AppError.js';
import { ERROR_CODES } from '../../constants/error-codes.js';

export class BadRequestError extends AppError {
  constructor(message, options = {}) {
    super(message, 400, options.data ?? null, options.code ?? ERROR_CODES.VALIDATION_FAILED);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message, options = {}) {
    super(message, 401, options.data ?? null, options.code ?? ERROR_CODES.AUTHENTICATION_REQUIRED);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message, options = {}) {
    super(message, 403, options.data ?? null, options.code ?? ERROR_CODES.ACCESS_DENIED);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message, options = {}) {
    super(message, 404, options.data ?? null, options.code ?? ERROR_CODES.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message, options = {}) {
    super(message, 409, options.data ?? null, options.code ?? ERROR_CODES.DUPLICATE_RECORD);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message, options = {}) {
    super(message, 429, options.data ?? null, options.code ?? ERROR_CODES.RATE_LIMITED);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message, options = {}) {
    super(message, 503, options.data ?? null, options.code ?? ERROR_CODES.SERVICE_UNAVAILABLE);
    this.name = 'ServiceUnavailableError';
  }
}

export { AppError, ERROR_CODES };
