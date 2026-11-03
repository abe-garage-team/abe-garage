import { env } from '../config/env.js';
import { ForbiddenError, ERROR_CODES } from '../utils/errors/index.js';
import { hasSessionCookie } from '../shared/sessions/session.cookie.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireTrustedOrigin(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (!hasSessionCookie(req)) return next();

  const allowedOrigin = new URL(env.frontendUrl).origin;
  const origin = req.get('Origin');
  const fetchSite = req.get('Sec-Fetch-Site');

  const originIsAllowed = origin === allowedOrigin;
  const browserSaysCrossSite = fetchSite === 'cross-site';

  if (!originIsAllowed || browserSaysCrossSite) {
    return next(
      new ForbiddenError('Request origin is not allowed', { code: ERROR_CODES.ORIGIN_NOT_ALLOWED }),
    );
  }
  next();
}
