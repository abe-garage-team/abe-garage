import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  ERROR_CODES,
} from '../../src/utils/errors/index.js';
import { errorHandler } from '../../src/middleware/error-handler.js';

function fakeResponse() {
  const res = { headersSent: false, headers: {}, statusCode: null, payload: null };
  res.set = (name, value) => {
    res.headers[name] = value;
  };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.payload = payload;
    return res;
  };
  return res;
}

test('typed errors carry the right status and default code', () => {
  const cases = [
    [new BadRequestError('x'), 400, ERROR_CODES.VALIDATION_FAILED],
    [new UnauthorizedError('x'), 401, ERROR_CODES.AUTHENTICATION_REQUIRED],
    [new ForbiddenError('x'), 403, ERROR_CODES.ACCESS_DENIED],
    [new NotFoundError('x'), 404, ERROR_CODES.NOT_FOUND],
    [new ConflictError('x'), 409, ERROR_CODES.DUPLICATE_RECORD],
    [new RateLimitError('x'), 429, ERROR_CODES.RATE_LIMITED],
    [new ServiceUnavailableError('x'), 503, ERROR_CODES.SERVICE_UNAVAILABLE],
  ];
  for (const [error, status, code] of cases) {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, status);
    assert.equal(error.code, code);
  }
});

test('error handler builds the shared envelope and hides unknown errors', () => {
  const res = fakeResponse();
  errorHandler(
    new ConflictError('Email already used', { code: ERROR_CODES.EMAIL_IN_USE }),
    { id: '1' },
    res,
    () => {},
  );
  assert.deepEqual(res.payload, {
    status: 'error',
    message: 'Email already used',
    data: null,
    code: ERROR_CODES.EMAIL_IN_USE,
  });

  const unknown = fakeResponse();
  const originalError = console.error;
  console.error = () => {};
  try {
    errorHandler(new Error('SELECT * FROM secret'), { id: '2' }, unknown, () => {});
  } finally {
    console.error = originalError;
  }
  assert.equal(unknown.statusCode, 500);
  assert.equal(unknown.payload.message, 'Something went wrong');
  assert.equal(unknown.payload.code, ERROR_CODES.INTERNAL_ERROR);
});

test('error handler maps JSON, size and duplicate-key errors and sets Retry-After', () => {
  const parse = fakeResponse();
  errorHandler({ type: 'entity.parse.failed' }, {}, parse, () => {});
  assert.equal(parse.statusCode, 400);

  const large = fakeResponse();
  errorHandler({ type: 'entity.too.large' }, {}, large, () => {});
  assert.equal(large.statusCode, 413);

  const duplicate = fakeResponse();
  errorHandler({ code: 'ER_DUP_ENTRY' }, {}, duplicate, () => {});
  assert.equal(duplicate.statusCode, 409);

  const limited = fakeResponse();
  errorHandler(new RateLimitError('slow down', { retryAfterSeconds: 42 }), {}, limited, () => {});
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.headers['Retry-After'], '42');
});
