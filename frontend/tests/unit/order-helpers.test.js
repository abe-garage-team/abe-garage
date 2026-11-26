import { test } from 'node:test';
import assert from 'node:assert';
import {
  canAddExtraWork,
  canEditLines,
  canEditOrder,
  defaultReadyDate,
  fieldErrors,
  findApprover,
  formatAmount,
  formatShortDate,
  hasStartedWork,
  humanizeAction,
  isFutureLocal,
  isValidMoney,
  parsePage,
  parsePaid,
  parseStatus,
  sumPrices,
  toApiDateTime,
  toLocalInputValue,
} from '../../src/utils/order-helpers.js';

test('money validation matches the backend rule', () => {
  ['0', '50', '50.5', '50.55', '0.50', '1234567890'].forEach((v) => assert.ok(isValidMoney(v), v));
  ['', '-1', '050', '1.234', 'abc', '5,00', '12345678901'].forEach((v) =>
    assert.equal(isValidMoney(v), false, v),
  );
});

test('sumPrices adds in cents without floating point drift', () => {
  assert.equal(sumPrices(['0.10', '0.20']), '0.30');
  assert.equal(sumPrices(['50.00', '180.00']), '230.00');
  assert.equal(sumPrices([]), '0.00');
});

test('local date input converts to an ISO string with a zone and back', () => {
  const iso = toApiDateTime('2026-11-25T17:00');
  assert.match(iso, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00Z$/);
  assert.equal(toLocalInputValue(iso), '2026-11-25T17:00');
  assert.equal(toApiDateTime(''), '');
  assert.equal(toLocalInputValue(null), '');
  assert.equal(toLocalInputValue('not a date'), '');
});

test('default ready date is tomorrow at 17:00 and in the future', () => {
  const now = new Date(2026, 10, 22, 9, 30);
  assert.equal(defaultReadyDate(now), '2026-11-23T17:00');
  assert.ok(isFutureLocal(defaultReadyDate(now), now));
  assert.equal(isFutureLocal('2026-11-22T09:00', now), false);
  assert.equal(isFutureLocal('', now), false);
});

test('display helpers cope with missing values', () => {
  assert.equal(formatShortDate(null), '—');
  assert.equal(formatShortDate('garbage'), '—');
  assert.equal(formatAmount(null), '—');
  assert.equal(formatAmount('abc'), '—');
  assert.ok(formatAmount('264.50', 'ETB').includes('264.50'));
  assert.equal(humanizeAction('estimate_approved'), 'Estimate approved');
  assert.equal(humanizeAction('job_started'), 'Job started');
  assert.equal(humanizeAction(null), 'Update');
});

test('URL filters are sanitised before they reach the API', () => {
  assert.equal(parsePage('3'), 3);
  assert.equal(parsePage('0'), 1);
  assert.equal(parsePage('x'), 1);
  assert.equal(parseStatus('4'), '4');
  assert.equal(parseStatus('9'), '');
  assert.equal(parsePaid('false'), 'false');
  assert.equal(parsePaid('yes'), '');
});

test('order rules mirror the backend', () => {
  const order = (status, extra = {}) => ({ status, paid: false, lines: [], ...extra });
  assert.ok(canEditLines(order(1)));
  assert.equal(canEditLines(order(2)), false);
  assert.equal(canEditOrder(order(5)), false);
  assert.ok(canEditOrder(order(4)));
  assert.ok(canAddExtraWork(order(3)));
  assert.equal(canAddExtraWork(order(4)), false);
  assert.equal(canAddExtraWork(order(2, { paid: true })), false);
  assert.ok(hasStartedWork(order(1, { lines: [{ line_status: 1 }] })));
  assert.equal(hasStartedWork(order(1, { lines: [{ line_status: 0 }] })), false);
});

test('approver is read from the audit trail; API errors are unwrapped', () => {
  const history = [
    { action: 'order_created', employee_name: 'A' },
    { action: 'estimate_approved', employee_name: 'Hana Bekele' },
  ];
  assert.equal(findApprover({ history }), 'Hana Bekele');
  assert.equal(findApprover({}), null);
  assert.deepEqual(fieldErrors({ data: { errors: { x: 'bad' } } }), { x: 'bad' });
  assert.deepEqual(fieldErrors(null), {});
});
