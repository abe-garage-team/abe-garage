import { env } from '../../config/env.js';
import { buildSignedCookieValue, readSignedCookieValue } from '../auth/tokens.js';

function cookieOptions(expiresAt) {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  };
}

export function setSessionCookie(res, token, expiresAt) {
  res.cookie(env.auth.cookieName, buildSignedCookieValue(token), cookieOptions(expiresAt));
}

export function clearSessionCookie(res) {
  res.cookie(env.auth.cookieName, '', { ...cookieOptions(new Date(0)), maxAge: 0 });
}

export function readSessionTokenFromRequest(req) {
  const cookieValue = req.cookies ? req.cookies[env.auth.cookieName] : undefined;
  return readSignedCookieValue(cookieValue);
}

export function hasSessionCookie(req) {
  return Boolean(req.cookies && req.cookies[env.auth.cookieName]);
}
