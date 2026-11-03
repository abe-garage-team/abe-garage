import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const SCRYPT_SETTINGS = { N: 16384, r: 16, p: 1, keyLength: 64 };
const SALT_BYTES = 16;

function runScrypt(password, salt, settings) {
  return new Promise((resolve, reject) => {
    const options = {
      N: settings.N,
      r: settings.r,
      p: settings.p,
      maxmem: 128 * settings.N * settings.r * 2,
    };
    scrypt(password, salt, settings.keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES);
  const hash = await runScrypt(password, salt, SCRYPT_SETTINGS);
  const parts = [
    'scrypt',
    SCRYPT_SETTINGS.N,
    SCRYPT_SETTINGS.r,
    SCRYPT_SETTINGS.p,
    salt.toString('hex'),
    hash.toString('hex'),
  ];
  return parts.join('$');
}

export async function verifyPassword(password, storedHash) {
  const parts = String(storedHash || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const settings = {
    N: Number(parts[1]),
    r: Number(parts[2]),
    p: Number(parts[3]),
    keyLength: Buffer.from(parts[5], 'hex').length,
  };
  const salt = Buffer.from(parts[4], 'hex');
  const expected = Buffer.from(parts[5], 'hex');
  const actual = await runScrypt(password, salt, settings);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

let cachedDummyHash = null;
export async function verifyAgainstDummyHash(password) {
  if (!cachedDummyHash) cachedDummyHash = await hashPassword('dummy-password-for-unknown-accounts');
  await verifyPassword(password, cachedDummyHash);
  return false;
}
