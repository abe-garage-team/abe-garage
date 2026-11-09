import { pool, withTransaction } from '../../../config/db.js';
import { ROLES } from '../../../constants/roles.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ERROR_CODES,
} from '../../../utils/errors/index.js';
import { hashPassword } from '../../../shared/auth/passwords.js';
import { AUTH_EVENT, recordAuthEvent } from '../../../shared/auth/auth-events.js';
import { markAllResetTokensUsed } from '../../../shared/auth/reset-tokens.js';
import { revokeAllSessionsForEmployee } from '../../../shared/sessions/session.store.js';
import { findPublicEmployeeById } from '../../../shared/employees/employee.queries.js';
import {
  EMPLOYEE_SELECT_COLUMNS,
  toPublicEmployee,
  toManagerEmployeeView,
} from '../../../shared/employees/employee.presenter.js';

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

export async function listEmployeesService(filters, actor) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const isManager = actor.role_id === ROLES.MANAGER;

  if (isManager) {
    const wantsOtherRole = filters.role_id !== undefined && filters.role_id !== ROLES.TECHNICIAN;
    const wantsInactive = filters.active !== undefined && filters.active !== true;
    if (wantsOtherRole || wantsInactive) {
      throw new ForbiddenError('Managers may only list active technicians');
    }
    filters = { ...filters, role_id: ROLES.TECHNICIAN, active: true };
  }

  const whereParts = [];
  const whereValues = [];
  if (filters.search) {
    const pattern = '%' + filters.search + '%';
    whereParts.push('(e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ?)');
    whereValues.push(pattern, pattern, pattern);
  }
  if (filters.role_id !== undefined) {
    whereParts.push('e.role_id = ?');
    whereValues.push(filters.role_id);
  }
  if (filters.active !== undefined) {
    whereParts.push('e.active = ?');
    whereValues.push(filters.active ? 1 : 0);
  }
  const whereSql = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM employees AS e ${whereSql}`,
    whereValues,
  );
  const total = Number(countRows[0].total);
  const offset = (page - 1) * limit;

  const [rows] = await pool.execute(
    `SELECT ${EMPLOYEE_SELECT_COLUMNS}
     FROM employees AS e JOIN roles AS r ON r.role_id = e.role_id
     ${whereSql}
     ORDER BY e.created_at DESC, e.employee_id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    whereValues,
  );

  const present = isManager ? toManagerEmployeeView : toPublicEmployee;
  return {
    employees: rows.map(present),
    pagination: { page, limit, total, total_pages: total === 0 ? 0 : Math.ceil(total / limit) },
  };
}

export async function getEmployeeService(employeeId) {
  const employee = await findPublicEmployeeById(employeeId);
  if (!employee) throw new NotFoundError('Employee not found');
  return toPublicEmployee(employee);
}

const EDITABLE_FIELDS = ['first_name', 'last_name', 'email', 'phone', 'role_id', 'active'];

export async function updateEmployeeService(employeeId, input, actor, requestInfo) {
  return withTransaction(async (connection) => {
    // Lock the Admin rows first (fixed order) whenever role or active may change, so two
    // concurrent demotions cannot both pass the last-Admin check below.
    let admins = [];
    if (input.role_id !== undefined || input.active !== undefined) {
      [admins] = await connection.execute(
        'SELECT employee_id, active FROM employees WHERE role_id = ? ORDER BY employee_id FOR UPDATE',
        [ROLES.ADMIN],
      );
    }

    const [rows] = await connection.execute(
      `SELECT ${EDITABLE_FIELDS.join(', ')} FROM employees WHERE employee_id = ? FOR UPDATE`,
      [employeeId],
    );
    const current = rows[0];
    if (!current) throw new NotFoundError('Employee not found');
    current.active = Boolean(current.active);

    // Only fields whose value really differs count as changes.
    const changes = {};
    for (const field of EDITABLE_FIELDS) {
      if (input[field] !== undefined && input[field] !== current[field])
        changes[field] = input[field];
    }

    const losesAdmin =
      current.role_id === ROLES.ADMIN &&
      current.active &&
      ('role_id' in changes || changes.active === false);
    if (losesAdmin) {
      const otherActiveAdmins = admins.filter((a) => a.active && a.employee_id !== employeeId);
      if (otherActiveAdmins.length === 0) {
        throw new ConflictError('At least one active Admin is required', {
          code: ERROR_CODES.LAST_ADMIN,
        });
      }
    }

    if (Object.keys(changes).length) {
      // Column names come from EDITABLE_FIELDS, never from the client.
      const setClause = Object.keys(changes)
        .map((field) => `${field} = ?`)
        .join(', ');
      const values = Object.values(changes).map((v) => (typeof v === 'boolean' ? Number(v) : v));
      try {
        await connection.execute(`UPDATE employees SET ${setClause} WHERE employee_id = ?`, [
          ...values,
          employeeId,
        ]);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          throw new ConflictError('Email already used', { code: ERROR_CODES.EMAIL_IN_USE });
        }
        throw error;
      }
    }

    // A role or active change ends every session of that employee: they must log in again.
    const audit = { ...requestInfo, employeeId, actorEmployeeId: actor.employee_id };
    if ('role_id' in changes || 'active' in changes) {
      await revokeAllSessionsForEmployee(employeeId, connection);
    }
    if ('role_id' in changes) {
      await recordAuthEvent(AUTH_EVENT.EMPLOYEE_ROLE_CHANGED, audit, connection);
    }
    if ('active' in changes) {
      await recordAuthEvent(AUTH_EVENT.EMPLOYEE_ACTIVE_CHANGED, audit, connection);
    }
    if ('email' in changes) await markAllResetTokensUsed(employeeId, connection);

    return toPublicEmployee(await findPublicEmployeeById(employeeId, connection));
  });
}
