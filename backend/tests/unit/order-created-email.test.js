import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderCreatedEmail } from '../../src/shared/notifications/templates/order-created.js';

test('order-created email escapes dynamic HTML and preserves plain text', () => {
  const customerName = `<Sara & "Hana's">`;
  const trackingUrl = 'https://example.com/track/demo?a=1&b=2';

  const email = buildOrderCreatedEmail({ customerName, trackingUrl });

  assert.equal(email.subject, 'Your Abe Garage order');
  assert.ok(email.text.includes(customerName));
  assert.ok(email.text.includes(trackingUrl));

  assert.ok(email.html.includes('&lt;Sara &amp; &quot;Hana&#39;s&quot;&gt;'));
  assert.ok(email.html.includes('href="https://example.com/track/demo?a=1&amp;b=2"'));
  assert.ok(!email.html.includes(customerName));
});
