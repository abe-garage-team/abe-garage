import { AppError } from '../../utils/errors/AppError.js';

// Decimal strings stay exact; never calculate invoice totals using floating point.
export function moneyToMinor(value) {
  const text = String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new AppError('Invalid monetary value in database', 500);
  }
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}

export function formatMinor(value) {
  return `${value / 100n}.${String(value % 100n).padStart(2, '0')}`;
}

export function calculateVat(subtotal, rate) {
  return (subtotal * moneyToMinor(rate) + 5000n) / 10000n;
}
