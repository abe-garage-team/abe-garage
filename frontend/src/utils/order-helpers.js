import { formatMoney } from './format-money.js';
import { HISTORY_LABELS, MONEY_PATTERN, ORDER_STATUS } from '../constants/orders.js';

const two = (n) => String(n).padStart(2, '0');


export function isAbortError(error) {
  return error?.name === 'AbortError';
}


export function fieldErrors(error) {
  return error?.data?.errors ?? {};
}



export function fullName(person) {
  return [person?.first_name, person?.last_name].filter(Boolean).join(' ');
}


export function formatShortDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${two(date.getDate())}/${two(date.getMonth() + 1)}/${date.getFullYear()}`;
}


export function formatAmount(value, currency) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return '—';
  }
  return formatMoney(value, currency || undefined);
}

export function humanizeAction(action) {
  if (!action) return 'Update';
  if (HISTORY_LABELS[action]) return HISTORY_LABELS[action];
  const text = String(action).replace(/[_-]+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}



export function toLocalInputValue(input) {
  if (input === null || input === undefined || input === '') return '';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
}

export function toApiDateTime(localValue) {
  const date = new Date(localValue);
  if (!localValue || Number.isNaN(date.getTime())) return '';
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}


export function defaultReadyDate(now = new Date()) {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  date.setHours(17, 0, 0, 0);
  return toLocalInputValue(date);
}

export function isFutureLocal(localValue, now = new Date()) {
  const time = new Date(localValue).getTime();
  return Number.isFinite(time) && time > now.getTime();
}


export function isValidMoney(value) {
  return MONEY_PATTERN.test(String(value).trim());
}


export function sumPrices(prices) {
  const cents = prices.reduce((sum, price) => sum + Math.round(Number(price) * 100), 0);
  return (cents / 100).toFixed(2);
}


export function parsePage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export function parseStatus(value) {
  const status = Number.parseInt(value, 10);
  return status >= 1 && status <= 5 ? String(status) : '';
}

export function parsePaid(value) {
  return value === 'true' || value === 'false' ? value : '';
}


export function canEditOrder(order) {
  return order.status !== ORDER_STATUS.DECLINED;
}


export function canEditLines(order) {
  return order.status === ORDER_STATUS.AWAITING_APPROVAL;
}


export function canAddExtraWork(order) {
  return (
    [ORDER_STATUS.AWAITING_APPROVAL, ORDER_STATUS.APPROVED, ORDER_STATUS.IN_PROGRESS].includes(
      order.status,
    ) && !order.paid
  );
}


export function hasStartedWork(order) {
  return (order.lines ?? []).some((line) => Number(line.line_status) > 0);
}


export function findApprover(order) {
  const entries = (order.history ?? []).filter((entry) => entry.action === 'estimate_approved');
  return entries.length ? entries[entries.length - 1].employee_name : null;
}
