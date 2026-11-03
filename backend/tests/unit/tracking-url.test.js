import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTrackingUrl } from '../../src/shared/notifications/tracking-url.js';

test('builds a tracking link using the configured HTTPS origin', () => {
  const result = buildTrackingUrl({
    frontendUrl: 'https://garage.example.com/other?source=test',
    orderHash: 'demo123',
  });

  assert.equal(result, 'https://garage.example.com/order-status/demo123');
});

test('rejects HTTP and malformed frontend URLs', () => {
  for (const frontendUrl of ['http://garage.example.com', 'invalid-url']) {
    assert.throws(() => buildTrackingUrl({ frontendUrl, orderHash: 'demo123' }));
  }
});

test('rejects frontend URLs containing credentials', () => {
  assert.throws(() =>
    buildTrackingUrl({
      frontendUrl: 'https://user:password@garage.example.com',
      orderHash: 'demo123',
    }),
  );
});

test('rejects missing or blank order hashes', () => {
  for (const orderHash of [undefined, null, '', '   ']) {
    assert.throws(() =>
      buildTrackingUrl({
        frontendUrl: 'https://garage.example.com',
        orderHash,
      }),
    );
  }
});

test('encodes special characters in the order hash', () => {
  const result = buildTrackingUrl({
    frontendUrl: 'https://garage.example.com',
    orderHash: 'demo/123?x=1#section',
  });

  assert.equal(result, 'https://garage.example.com/order-status/demo%2F123%3Fx%3D1%23section');
});
