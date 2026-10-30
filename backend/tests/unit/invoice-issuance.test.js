import test from 'node:test';
import assert from 'node:assert/strict';
import { createBillingService } from '../../src/api/billing/service/billing.service.js';
import { moneyToMinor, formatMinor, calculateVat } from '../../src/shared/order-domain/money.js';

function setup(overrides = {}) {
  const state = {
    order: { order_id: 24, vehicle_id: 8, status: 4, vat_rate: '15.00', currency: 'ETB' },
    lines: [
      {
        line_id: 41,
        line_status: 2,
        line_price: '50.00',
        service_name: 'Oil change',
        description: 'Oil and filter',
      },
      {
        line_id: 42,
        line_status: 2,
        line_price: '180.00',
        service_name: 'Brakes',
        description: 'Inspect brakes',
      },
    ],
    identity: {
      customer_id: 12,
      first_name: 'Sara',
      last_name: 'Tesfaye',
      email: 'sara@example.com',
      phone: '0912345678',
      year: 2020,
      make: 'Toyota',
      model: 'Corolla',
      vehicle_type: 'Sedan',
      mileage: 65000,
      plate: 'AA-12345',
      vin: null,
      color: 'White',
    },
    garage: {
      name: 'Abe Garage',
      address: 'Addis Ababa',
      email: 'garage@example.com',
      phone: '0111234567',
    },
    invoice: null,
    history: [],
    payment: undefined,
    queries: [],
    inserts: 0,
    ...overrides,
  };
  const db = {
    async execute(sql, values) {
      const q = sql.replace(/\s+/g, ' ');
      state.queries.push({ sql: q, values });
      if (q.includes('FROM orders WHERE')) return [[state.order].filter(Boolean)];
      if (q.includes('FROM invoices WHERE')) return [[state.invoice].filter(Boolean)];
      if (q.includes('FROM order_lines')) return [state.lines];
      if (q.includes('FROM vehicles')) return [[state.identity].filter(Boolean)];
      if (q.includes('FROM garage_settings')) return [[state.garage].filter(Boolean)];
      if (q.includes('FROM cash_payments')) return [[state.payment].filter(Boolean)];
      if (q.includes('INSERT INTO invoices')) {
        const keys = [
          'order_id',
          'invoice_number',
          'issued_by',
          'garage_name',
          'garage_address',
          'garage_phone',
          'garage_email',
          'customer_first_name',
          'customer_last_name',
          'customer_email',
          'customer_phone',
          'vehicle_year',
          'vehicle_make',
          'vehicle_model',
          'vehicle_type',
          'vehicle_mileage',
          'vehicle_plate',
          'vehicle_vin',
          'vehicle_color',
        ];
        state.invoice = {
          invoice_id: 1,
          issued_at: '2026-11-01 12:00:00.000000',
          ...Object.fromEntries(keys.map((k, i) => [k, values[i]])),
        };
        state.inserts++;
        return [{ insertId: 1 }];
      }
      if (q.includes('INSERT INTO order_history')) {
        if (state.failHistory) throw new Error('History unavailable');
        state.history.push(values);
        return [{ insertId: 1 }];
      }
      throw new Error('Unexpected SQL: ' + q);
    },
  };
  const { issueInvoiceService } = createBillingService({
    transaction: async (work) => {
      const before = JSON.parse(
        JSON.stringify({ invoice: state.invoice, history: state.history, inserts: state.inserts }),
      );
      try {
        return await work(db);
      } catch (error) {
        Object.assign(state, before);
        throw error;
      }
    },
  });
  return { state, issueInvoiceService };
}

test('issues a safe immutable document with exact totals and nullable VIN', async () => {
  const { state, issueInvoiceService } = setup();
  const { created, invoice } = await issueInvoiceService(24, 7);
  assert.equal(created, true);
  assert.equal(invoice.invoice_number, 'INV-000024');
  assert.equal(invoice.issued_at, '2026-11-01T12:00:00Z');
  assert.deepEqual(
    [invoice.subtotal, invoice.vat_rate, invoice.vat_amount, invoice.total],
    ['230.00', '15.00', '34.50', '264.50'],
  );
  assert.equal(invoice.vehicle.vin, null);
  assert.deepEqual([invoice.paid, invoice.paid_at, invoice.paid_received_by], [false, null, null]);
  assert.equal('issued_by' in invoice, false);
  assert.equal('order_hash' in invoice, false);
  assert.equal('internal_notes' in invoice, false);
  assert.deepEqual(state.history, [[24, 7, 'invoice_issued']]);
  assert.match(state.queries[0].sql, /FOR UPDATE/);
  assert.equal(state.order.status, 4);
});

test('repeat issuance preserves snapshot despite master-data edits and overlays live payment', async () => {
  const { state, issueInvoiceService } = setup();
  const first = await issueInvoiceService(24, 7);
  state.identity.first_name = 'Changed';
  state.identity.plate = 'Changed';
  state.garage.name = 'Changed';
  const repeat = await issueInvoiceService(24, 9);
  assert.equal(repeat.created, false);
  assert.deepEqual(repeat.invoice, first.invoice);
  state.payment = { paid_at: '2026-11-02 10:00:00', received_by: 9 };
  const paid = await issueInvoiceService(24, 9);
  assert.equal(paid.invoice.paid, true);
  assert.equal(paid.invoice.paid_received_by, 9);
  assert.equal(state.inserts, 1);
  assert.equal(state.history.length, 1);
});

test('missing order returns 404 without writes', async () => {
  const { state, issueInvoiceService } = setup({ order: null });
  await assert.rejects(issueInvoiceService(24, 7), (error) => error.statusCode === 404);
  assert.equal(state.inserts, 0);
});

test('unfinished, declined, empty and inconsistent completed orders return 409 without writes', async () => {
  for (const status of [1, 2, 3, 5]) {
    const { state, issueInvoiceService } = setup();
    state.order.status = status;
    await assert.rejects(issueInvoiceService(24, 7), (error) => error.statusCode === 409);
    assert.equal(state.inserts, 0);
  }
  for (const lines of [[], [{ line_status: 1 }]]) {
    const { state, issueInvoiceService } = setup({ lines });
    await assert.rejects(issueInvoiceService(24, 7), (error) => error.statusCode === 409);
    assert.equal(state.inserts, 0);
  }
});

test('audit failure rolls back invoice creation', async () => {
  const { state, issueInvoiceService } = setup({ failHistory: true });
  await assert.rejects(issueInvoiceService(24, 7), /History unavailable/);
  assert.equal(state.invoice, null);
  assert.equal(state.inserts, 0);
});

test('invalid identifiers never start a transaction', async () => {
  const { state, issueInvoiceService } = setup();
  for (const id of [0, -1, 1.5, '24', 4294967296]) {
    await assert.rejects(issueInvoiceService(id, 7), (error) => error.statusCode === 400);
  }
  assert.equal(state.queries.length, 0);
});

test('money uses exact minor units, rounds half up, and rejects malformed values', () => {
  assert.equal(formatMinor(moneyToMinor('9999999999.99')), '9999999999.99');
  assert.equal(formatMinor(calculateVat(10n, '5.00')), '0.01');
  assert.equal(formatMinor(calculateVat(1n, '15.00')), '0.00');
  assert.equal(formatMinor(calculateVat(100n, '100.00')), '1.00');
  for (const bad of ['-1', '1.001', 'NaN', '1e3']) assert.throws(() => moneyToMinor(bad));
});
