import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { NotFoundError, ForbiddenError, ERROR_CODES } from '../utils/errors/index.js';

export function requireSetupKey(req, res, next) {
  if (!env.installEnabled) return next(new NotFoundError('Route not found'));

  const givenKey = Buffer.from(req.get('X-Setup-Key') || '');
  const expectedKey = Buffer.from(env.installSecret);
  const keyMatches =
    expectedKey.length > 0 &&
    givenKey.length === expectedKey.length &&
    timingSafeEqual(givenKey, expectedKey);

  if (!keyMatches) {
    return next(
      new ForbiddenError('Setup access denied', { code: ERROR_CODES.SETUP_ACCESS_DENIED }),
    );
  }
  next();
}
