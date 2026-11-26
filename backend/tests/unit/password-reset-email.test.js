import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearFakeSentMessages,
  getFakeSentMessages,
} from '../../src/shared/notifications/fake-transport.js';

// Each test file has its own worker; force fake delivery before config is loaded.
process.env.MAIL_ADAPTER = 'fake';
process.env.FRONTEND_URL = 'https://garage.example.com';
const { sendPasswordResetEmail } =
  await import('../../src/shared/notifications/notification.service.js');
after(clearFakeSentMessages);
const input = {
  to: 'staff@example.com',
  firstName: '<Sara & Hana>',
  resetUrl: 'https://garage.example.com/reset-password?token=fake-test-token',
  expiresInMinutes: 15,
};

test('reset delivery keeps existing auth inputs and escapes HTML', async () => {
  clearFakeSentMessages();
  assert.equal(await sendPasswordResetEmail(input), true);
  const [message] = getFakeSentMessages();
  assert.equal(message.to, input.to);
  assert.ok(message.text.includes('15 minutes'));
  assert.ok(message.html.includes('&lt;Sara &amp; Hana&gt;'));
  assert.ok(message.text.includes(input.resetUrl));
});

test('reset delivery rejects HTTP, foreign origins, credentials and malformed URLs without throwing', async () => {
  clearFakeSentMessages();
  for (const resetUrl of [
    'http://garage.example.com/reset-password?token=secret',
    'https://untrusted.example/reset-password?token=secret',
    'https://user:pass@garage.example.com/reset-password?token=secret',
    'not-a-url',
  ]) {
    assert.equal(await sendPasswordResetEmail({ ...input, resetUrl }), false);
  }
  assert.equal(getFakeSentMessages().length, 0);
});
