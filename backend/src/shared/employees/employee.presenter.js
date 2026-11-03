import { toBoolean, toIsoUtc } from '../../utils/serialize.js';

export const EMPLOYEE_SELECT_COLUMNS = `
  e.employee_id, e.first_name, e.last_name, e.email, e.phone,
  e.role_id, r.role_name, e.active, e.created_at`;

export function toPublicEmployee(row) {
  return {
    employee_id: row.employee_id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone,
    role_id: row.role_id,
    role_name: row.role_name,
    active: toBoolean(row.active),
    created_at: toIsoUtc(row.created_at),
  };
}

export function toManagerEmployeeView(row) {
  return {
    employee_id: row.employee_id,
    first_name: row.first_name,
    last_name: row.last_name,
    role_name: row.role_name,
  };
}
