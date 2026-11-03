import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env.js';

const TOKEN_BYTES = 32;
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function generateRandomToken() {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function signToken(token) {
  return createHmac('sha256', env.auth.pepper).update(token).digest('base64url');
}

export function buildSignedCookieValue(token) {
  return token + '.' + signToken(token);
}

export function readSignedCookieValue(cookieValue) {
  if (typeof cookieValue !== 'string') return null;
  const separatorIndex = cookieValue.indexOf('.');
  if (separatorIndex === -1) return null;
  const token = cookieValue.slice(0, separatorIndex);
  const givenSignature = cookieValue.slice(separatorIndex + 1);
  if (!TOKEN_PATTERN.test(token)) return null;
  const expectedSignature = signToken(token);
  const given = Buffer.from(givenSignature);
  const expected = Buffer.from(expectedSignature);
  if (given.length !== expected.length) return null;
  if (!timingSafeEqual(given, expected)) return null;
  return token;
}

export function hashRateLimitKey(parts) {
  return createHmac('sha256', env.auth.pepper).update(parts.join('|')).digest('hex');
}
