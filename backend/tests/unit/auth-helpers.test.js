import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateRandomToken,
  hashToken,
  buildSignedCookieValue,
  readSignedCookieValue,
  TOKEN_PATTERN,
} from '../../src/shared/auth/tokens.js';
import {
  hashPassword,
  verifyPassword,
  verifyAgainstDummyHash,
} from '../../src/shared/auth/passwords.js';
import { toBoolean, toIsoUtc, toDecimalString, pickFields } from '../../src/utils/serialize.js';

test('random tokens are 43 url-safe characters and hash to 64 hex characters', () => {
  const token = generateRandomToken();
  assert.match(token, TOKEN_PATTERN);
  assert.match(hashToken(token), /^[0-9a-f]{64}$/);
  assert.notEqual(generateRandomToken(), token);
});

test('signed cookie values round-trip and reject tampering', () => {
  const token = generateRandomToken();
  const cookieValue = buildSignedCookieValue(token);
  assert.equal(readSignedCookieValue(cookieValue), token);

  const otherToken = generateRandomToken();
  const forged = otherToken + cookieValue.slice(cookieValue.indexOf('.'));
  assert.equal(readSignedCookieValue(forged), null);
  assert.equal(readSignedCookieValue(token), null);
  assert.equal(readSignedCookieValue(cookieValue + 'x'), null);
  assert.equal(readSignedCookieValue(undefined), null);
});

test('passwords hash with scrypt and verify correctly', async () => {
  const hash = await hashPassword('Password123!');
  assert.match(hash, /^scrypt\$16384\$16\$1\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.equal(await verifyPassword('Password123!', hash), true);
  assert.equal(await verifyPassword('Password123', hash), false);
  assert.equal(await verifyPassword('Password123!', 'not-a-hash'), false);
  assert.equal(await verifyAgainstDummyHash('anything'), false);
});

test('serializer converts database values to contract values', () => {
  assert.equal(toBoolean(1), true);
  assert.equal(toBoolean(0), false);
  assert.equal(toIsoUtc('2026-10-25 12:00:00.000000'), '2026-10-25T12:00:00Z');
  assert.equal(toIsoUtc(null), null);
  assert.equal(toDecimalString('15'), '15.00');
  assert.deepEqual(pickFields({ a: 1, password_hash: 'x' }, ['a', 'b']), { a: 1, b: null });
});
