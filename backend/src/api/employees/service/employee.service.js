import { pool } from '../../../config/db.js';
import { ConflictError, ERROR_CODES } from '../../../utils/errors/index.js';
import { hashPassword } from '../../../shared/auth/passwords.js';
import { AUTH_EVENT, recordAuthEvent } from '../../../shared/auth/auth-events.js';
import { findPublicEmployeeById } from '../../../shared/employees/employee.queries.js';
import { toPublicEmployee } from '../../../shared/employees/employee.presenter.js';

export async function createEmployeeService(input, actor, requestInfo) {
  const passwordHash = await hashPassword(input.password);
  const active = input.active === undefined ? true : input.active;

  let employeeId;
  try {
    const [result] = await pool.execute(
      `INSERT INTO employees (email, first_name, last_name, phone, password_hash, role_id, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.email,
        input.first_name,
        input.last_name,
        input.phone,
        passwordHash,
        input.role_id,
        active ? 1 : 0,
      ],
    );
    employeeId = result.insertId;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new ConflictError('Email already used', { code: ERROR_CODES.EMAIL_IN_USE });
    }
    throw error;
  }

  await recordAuthEvent(AUTH_EVENT.EMPLOYEE_CREATED, {
    ...requestInfo,
    employeeId,
    actorEmployeeId: actor.employee_id,
  });
  return toPublicEmployee(await findPublicEmployeeById(employeeId));
}
