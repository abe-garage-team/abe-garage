import { rateLimit } from 'express-rate-limit';
import { RateLimitError } from '../utils/errors/index.js';
import { MySqlRateLimitStore } from '../shared/rate-limit/rate-limit.store.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;

function tooManyRequests(req, res, next, options) {
  const resetTime = req.rateLimit?.resetTime;
  const retryAfterSeconds = resetTime
    ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : Math.ceil(options.windowMs / 1000);
  next(new RateLimitError('Too many attempts. Please try again later.', { retryAfterSeconds }));
}

function readEmail(req, field) {
  if (!field || !req.body || typeof req.body[field] !== 'string') return null;
  return req.body[field].trim().toLowerCase();
}

function limiter({ action, scope, windowMs, limit, keyGenerator, skip }) {
  return rateLimit({
    windowMs,
    limit,
    keyGenerator,
    skip,
    handler: tooManyRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: new MySqlRateLimitStore({ prefix: `${action}:${scope}` }),
  });
}

function createRateLimit({ action, maxHitsPerIp, maxHitsPerAccount, windowMs, emailField }) {
  const byIp = limiter({
    action,
    scope: 'ip',
    windowMs,
    limit: maxHitsPerIp,
  });
  if (!emailField) return [byIp];
  const byAccount = limiter({
    action,
    scope: 'account',
    windowMs,
    limit: maxHitsPerAccount,
    keyGenerator: (req) => readEmail(req, emailField),
    skip: (req) => !readEmail(req, emailField),
  });
  return [byIp, byAccount];
}

export const loginRateLimit = createRateLimit({
  action: 'login',
  maxHitsPerIp: 30,
  maxHitsPerAccount: 10,
  windowMs: FIFTEEN_MINUTES,
  emailField: 'email',
});

export const forgotPasswordRateLimit = createRateLimit({
  action: 'forgot-password',
  maxHitsPerIp: 10,
  maxHitsPerAccount: 5,
  windowMs: FIFTEEN_MINUTES,
  emailField: 'email',
});

export const resetPasswordRateLimit = createRateLimit({
  action: 'reset-password',
  maxHitsPerIp: 10,
  windowMs: FIFTEEN_MINUTES,
});

export const publicLookupRateLimit = createRateLimit({
  action: 'public-lookup',
  maxHitsPerIp: 120,
  windowMs: ONE_MINUTE,
});
