import { AppError, ERROR_CODES } from '../utils/errors/index.js';
import { logError } from '../utils/log.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let statusCode = 500;
  let message = 'Something went wrong';
  let data = null;
  let code = ERROR_CODES.INTERNAL_ERROR;

  if (error instanceof AppError && error.isOperational) {
    statusCode = error.statusCode;
    message = error.message;
    data = error.data;
    code = error.code;
    if (statusCode === 429 && error.retryAfterSeconds) {
      res.set('Retry-After', String(error.retryAfterSeconds));
    }
  } else if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON body';
    code = ERROR_CODES.INVALID_JSON;
  } else if (error.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
    code = ERROR_CODES.PAYLOAD_TOO_LARGE;
  } else if (error.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'A record with this unique value already exists';
    code = ERROR_CODES.DUPLICATE_RECORD;
  }

  if (statusCode >= 500) {
    logError({
      request_id: req.id,
      method: req.method,
      route: req.originalUrl ? req.originalUrl.split('?')[0] : undefined,
      status_code: statusCode,
      error_name: error.name,
      code: error.code,
    });
  }

  return res.status(statusCode).json({ status: 'error', message, data, code });
}
