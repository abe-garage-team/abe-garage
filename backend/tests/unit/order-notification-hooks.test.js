import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// Isolated test-worker doubles replace infrastructure, not the order service under test.
let state;
const key = Symbol.for('abe.be043.order-hooks');
const connection = {
  async execute(sql) {
    const q = sql.replace(/\s+/g, ' ').trim();
    if (q.startsWith('SELECT order_id, status')) return [[{ order_id: 24, status: state.status }]];
    if (q.startsWith('SELECT line_id, line_status'))
      return [[{ line_id: 1, line_status: state.lineStatus }]];
    if (q.includes('UTC_TIMESTAMP(6) AS decided_at'))
      return [[{ decided_at: '2026-11-26 12:00:00' }]];
    if (q.startsWith('SELECT o.order_hash'))
      return [
        [
          {
            order_hash: 'private-hash',
            email: 'sara@example.com',
            first_name: 'Sara',
            last_name: 'Tesfaye',
          },
        ],
      ];
    if (q.includes('FROM v_orders'))
      return [
        [
          {
            order_id: 24,
            vehicle_id: 8,
            status: 1,
            subtotal: '100.00',
            vat_rate: '15.00',
            currency: 'ETB',
            order_hash: 'private-hash',
            created_at: '2026-11-26 12:00:00',
          },
        ],
      ];
    if (q.includes('FROM customers'))
      return [
        [
          {
            customer_id: 12,
            active: 1,
            first_name: 'Sara',
            last_name: 'Tesfaye',
            email: 'sara@example.com',
          },
        ],
      ];
    if (q.includes('FROM vehicles')) return [[{ vehicle_id: 8, customer_id: 12 }]];
    if (q.includes('FROM garage_settings')) return [[{ vat_rate: '15.00', currency: 'ETB' }]];
    if (q.includes('FROM service_versions'))
      return [[{ service_version_id: 1, default_price: '100.00' }]];
    if (q.includes('FROM services')) return [[{ service_id: 1, active: 1 }]];
    if (q.startsWith('SELECT')) return [[]];
    if (q.startsWith('UPDATE orders')) state.status = q.includes('status = 4') ? 4 : state.status;
    return [{ insertId: 24 }];
  },
};
globalThis[key] = {
  db: {
    pool: connection,
    async withTransaction(work) {
      state.events.push('begin');
      try {
        const result = await work(connection);
        if (state.failCommit) throw new Error('Commit failed');
        state.events.push('commit');
        return result;
      } catch (error) {
        state.events.push('rollback');
        throw error;
      }
    },
  },
  mail: {
    async sendOrderCreatedEmail(input) {
      return send('created', input);
    },
    async sendCarReadyEmail(input) {
      return send('ready', input);
    },
  },
};
function send(kind, input) {
  assert.equal(state.events.at(-1), 'commit');
  state.events.push(kind);
  state.messages.push(input);
  if (state.failMail) throw new Error('Adapter failed');
  return true;
}
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.includes('/api/orders/service/order.service.js')) {
      let body;
      if (specifier.endsWith('/config/db.js'))
        body = `const x=globalThis[Symbol.for('abe.be043.order-hooks')].db; export const pool=x.pool; export const withTransaction=x.withTransaction;`;
      if (specifier.endsWith('/notifications/notification.service.js'))
        body = `const x=globalThis[Symbol.for('abe.be043.order-hooks')].mail; export const sendOrderCreatedEmail=x.sendOrderCreatedEmail; export const sendCarReadyEmail=x.sendCarReadyEmail;`;
      if (body)
        return { url: 'data:text/javascript,' + encodeURIComponent(body), shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { createOrderService, recordApprovalService } =
  await import('../../src/api/orders/service/order.service.js');
after(() => {
  hooks.deregister();
  delete globalThis[key];
});
function reset(options = {}) {
  state = { status: 1, lineStatus: 2, events: [], messages: [], ...options };
}
const orderInput = {
  customer_id: 12,
  vehicle_id: 8,
  estimated_ready_date: '2026-12-01T12:00:00Z',
  lines: [{ service_id: 1 }],
};

test('creation sends saved customer/hash only after commit', async () => {
  reset();
  const result = await createOrderService(orderInput, 7);
  assert.equal(result.order_id, 24);
  assert.deepEqual(state.events, ['begin', 'commit', 'created']);
  assert.deepEqual(state.messages[0], {
    to: 'sara@example.com',
    customerName: 'Sara Tesfaye',
    orderHash: 'private-hash',
    orderId: 24,
    employeeId: 7,
  });
});
test('failed creation commit sends no email', async () => {
  reset({ failCommit: true });
  await assert.rejects(createOrderService(orderInput, 7), /Commit failed/);
  assert.equal(state.messages.length, 0);
});
test('unexpected creation adapter failure preserves committed response', async () => {
  reset({ failMail: true });
  assert.equal((await createOrderService(orderInput, 7)).order_id, 24);
  assert.deepEqual(state.events, ['begin', 'commit', 'created']);
});
test('approval completing all work sends once after commit without exposing internal flags', async () => {
  reset();
  const result = await recordApprovalService(
    24,
    { decision: 'approved', approval_method: 'phone' },
    7,
  );
  assert.equal(result.status, 4);
  assert.equal('completionEmail' in result, false);
  assert.equal('newlyCompleted' in result, false);
  assert.deepEqual(state.events, ['begin', 'commit', 'ready']);
  await assert.rejects(
    recordApprovalService(24, { decision: 'approved' }, 7),
    /not awaiting approval/,
  );
  assert.equal(state.messages.length, 1);
});
test('approval of unfinished work sends no completion email', async () => {
  reset({ lineStatus: 0 });
  assert.equal((await recordApprovalService(24, { decision: 'approved' }, 7)).status, 2);
  assert.equal(state.messages.length, 0);
});
test('decline sends no completion email', async () => {
  reset({ lineStatus: 0 });
  assert.equal((await recordApprovalService(24, { decision: 'declined' }, 7)).status, 5);
  assert.equal(state.messages.length, 0);
});
test('failed approval commit sends no completion email', async () => {
  reset({ failCommit: true });
  await assert.rejects(recordApprovalService(24, { decision: 'approved' }, 7), /Commit failed/);
  assert.equal(state.messages.length, 0);
});
test('unexpected completion adapter failure preserves committed response', async () => {
  reset({ failMail: true });
  assert.equal((await recordApprovalService(24, { decision: 'approved' }, 7)).status, 4);
  assert.deepEqual(state.events, ['begin', 'commit', 'ready']);
});
