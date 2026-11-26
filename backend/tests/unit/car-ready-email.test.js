import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCarReadyEmail } from '../../src/shared/notifications/templates/car-ready.js';

test('car-ready email includes collection details and escapes dynamic HTML', () => {
  const customerName = `<Sara & "Hana's">`;
  const trackingUrl = 'https://example.com/track/demo?a=1&b=2';

  const email = buildCarReadyEmail({ customerName, trackingUrl });

  assert.equal(email.subject, 'Your car is ready — Abe Garage');
  assert.ok(email.text.includes('ready for collection'));
  assert.ok(email.text.includes(customerName));
  assert.ok(email.text.includes(trackingUrl));

  assert.ok(email.html.includes('&lt;Sara &amp; &quot;Hana&#39;s&quot;&gt;'));
  assert.ok(email.html.includes('href="https://example.com/track/demo?a=1&amp;b=2"'));
  assert.ok(!email.html.includes(customerName));
});
