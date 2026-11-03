export function toBoolean(value) {
  return value === 1 || value === true || value === '1';
}

export function toIsoUtc(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const text = String(value).trim();
  const withoutFraction = text.replace(/\.\d+$/, '');
  return withoutFraction.replace(' ', 'T') + 'Z';
}

export function toDecimalString(value) {
  if (value === null || value === undefined) return null;
  return Number(value).toFixed(2);
}

export function pickFields(source, allowedKeys) {
  const result = {};
  for (const key of allowedKeys) {
    result[key] = source[key] === undefined ? null : source[key];
  }
  return result;
}
