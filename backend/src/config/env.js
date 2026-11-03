import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

function integer(name, fallback, { min = 1 } = {}) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < min)
    throw new Error(name + ' must be an integer of at least ' + min);
  return value;
}
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const cookieBaseName = process.env.SESSION_COOKIE_NAME || 'abe_session';

export const env = Object.freeze({
  nodeEnv,
  isProduction,
  port: integer('PORT', 5000),
  trustProxy: integer('TRUST_PROXY', 0, { min: 0 }),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: integer('DB_PORT', 3306),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'abe_garage',
    connectionLimit: integer('DB_CONNECTION_LIMIT', 10),
  },
  auth: {
    pepper: process.env.AUTH_TOKEN_PEPPER || '',
    cookieName: isProduction ? '__Host-' + cookieBaseName : cookieBaseName,
    sessionTtlMs: integer('SESSION_TTL_HOURS', 12) * 3600000,
    sessionUpdateAgeMs: integer('SESSION_UPDATE_AGE_HOURS', 2) * 3600000,
    sessionAbsoluteMs: integer('SESSION_ABSOLUTE_HOURS', 168) * 3600000,
    maxSessionsPerEmployee: integer('SESSION_MAX_PER_EMPLOYEE', 10),
    resetTokenTtlMs: 15 * 60000,
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  timezone: process.env.GARAGE_TIMEZONE || 'Africa/Addis_Ababa',
  currency: process.env.CURRENCY_CODE || 'ETB',
  mailAdapter: process.env.MAIL_ADAPTER || (isProduction ? 'smtp' : 'fake'),
  installEnabled: process.env.INSTALL_ENABLED === 'true',
  installSecret: process.env.INSTALL_SECRET || '',
});

export function assertServerConfiguration() {
  if (env.auth.pepper.length < 32)
    throw new Error(
      'Set AUTH_TOKEN_PEPPER to a random value of at least 32 characters in backend/.env',
    );
  if (!env.db.user) throw new Error('Set DB_USER in backend/.env');
  if (env.isProduction && env.mailAdapter !== 'smtp')
    throw new Error('MAIL_ADAPTER must be smtp in production');
  if (env.auth.sessionUpdateAgeMs >= env.auth.sessionTtlMs)
    throw new Error('SESSION_UPDATE_AGE_HOURS must be smaller than SESSION_TTL_HOURS');
  try {
    new URL(env.corsOrigin);
    new URL(env.frontendUrl);
  } catch {
    throw new Error('CORS_ORIGIN and FRONTEND_URL must be absolute URLs');
  }
}
