import test from 'node:test';
import assert from 'node:assert/strict';
import { recordEmailDelivery } from '../../src/shared/notifications/delivery-history.js';

test('records successful delivery with the staff actor', async () => {
  const calls = [];
  const db = {
    async execute(sql, values) {
      calls.push({ sql, values });
    },
  };

  await recordEmailDelivery({
    db,
    orderId: 24,
    employeeId: 7,
    sent: true,
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /INSERT INTO order_history/);
  assert.deepEqual(calls[0].values, [24, 7, 'email_sent']);
});

test('records failed delivery without a staff actor', async () => {
  const calls = [];
  const db = {
    async execute(sql, values) {
      calls.push({ sql, values });
    },
  };

  await recordEmailDelivery({
    db,
    orderId: 24,
    sent: false,
  });

  assert.deepEqual(calls[0].values, [24, null, 'email_failed']);
});

test('rejects a non-boolean delivery result without writing', async () => {
  let called = false;
  const db = {
    async execute() {
      called = true;
    },
  };

  await assert.rejects(recordEmailDelivery({ db, orderId: 24, sent: 'false' }), TypeError);

  assert.equal(called, false);
});

test('propagates database errors to the caller', async () => {
  const failure = new Error('Database unavailable');
  const db = {
    async execute() {
      throw failure;
    },
  };

  await assert.rejects(
    recordEmailDelivery({ db, orderId: 24, sent: true }),
    (error) => error === failure,
  );
});
