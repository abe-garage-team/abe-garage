import { pool } from '../../config/db.js';
import { EMPLOYEE_SELECT_COLUMNS } from './employee.presenter.js';

export async function findPublicEmployeeById(employeeId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT ${EMPLOYEE_SELECT_COLUMNS}
     FROM employees AS e JOIN roles AS r ON r.role_id = e.role_id
     WHERE e.employee_id = ?`,
    [employeeId],
  );
  return rows[0] || null;
}

export async function findEmployeeWithPasswordByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT ${EMPLOYEE_SELECT_COLUMNS}, e.password_hash
     FROM employees AS e JOIN roles AS r ON r.role_id = e.role_id
     WHERE e.email = ?`,
    [email],
  );
  return rows[0] || null;
}
