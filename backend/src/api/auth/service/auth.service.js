import { pool, withTransaction } from '../../../config/db.js';
import { env } from '../../../config/env.js';
import {
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ERROR_CODES,
} from '../../../utils/errors/index.js';
import {
  hashPassword,
  verifyPassword,
  verifyAgainstDummyHash,
} from '../../../shared/auth/passwords.js';
import { generateRandomToken, hashToken } from '../../../shared/auth/tokens.js';
import { AUTH_EVENT, recordAuthEvent } from '../../../shared/auth/auth-events.js';
import {
  createSessionForEmployee,
  revokeSessionById,
  revokeAllSessionsForEmployee,
} from '../../../shared/sessions/session.store.js';
import { findEmployeeWithPasswordByEmail } from '../../../shared/employees/employee.queries.js';
import { toPublicEmployee } from '../../../shared/employees/employee.presenter.js';
import { sendPasswordResetEmail } from '../../../shared/notifications/notification.service.js';
import { markAllResetTokensUsed } from '../../../shared/auth/reset-tokens.js';

const RESET_TOKEN_TTL_SECONDS = Math.floor(env.auth.resetTokenTtlMs / 1000);

export async function loginService({ email, password }, requestInfo) {
  const employee = await findEmployeeWithPasswordByEmail(email);

  const passwordMatches = employee
    ? await verifyPassword(password, employee.password_hash)
    : await verifyAgainstDummyHash(password);

  if (!passwordMatches) {
    await recordAuthEvent(AUTH_EVENT.LOGIN_FAILED, { ...requestInfo, emailAttempted: email });
    throw new UnauthorizedError('Invalid email or password', {
      code: ERROR_CODES.INVALID_CREDENTIALS,
    });
  }

  if (!employee.active) {
    await recordAuthEvent(AUTH_EVENT.LOGIN_DISABLED_ACCOUNT, {
      ...requestInfo,
      employeeId: employee.employee_id,
    });
    throw new ForbiddenError('Account disabled', { code: ERROR_CODES.ACCOUNT_DISABLED });
  }

  const session = await createSessionForEmployee(employee.employee_id, requestInfo);
  await recordAuthEvent(AUTH_EVENT.LOGIN_SUCCESS, {
    ...requestInfo,
    employeeId: employee.employee_id,
  });

  return { employee: toPublicEmployee(employee), session };
}

export async function logoutService(user, requestInfo) {
  await revokeSessionById(user.session_id);
  await recordAuthEvent(AUTH_EVENT.LOGOUT, { ...requestInfo, employeeId: user.employee_id });
}

export async function changePasswordService(user, { currentPassword, newPassword }, requestInfo) {
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      'SELECT employee_id, password_hash, active FROM employees WHERE employee_id = ? FOR UPDATE',
      [user.employee_id],
    );
    const employee = rows[0];
    if (!employee || !employee.active) {
      throw new ForbiddenError('Account disabled', { code: ERROR_CODES.ACCOUNT_DISABLED });
    }

    const currentMatches = await verifyPassword(currentPassword, employee.password_hash);
    if (!currentMatches) {
      throw new BadRequestError('Current password is incorrect', {
        code: ERROR_CODES.CURRENT_PASSWORD_INCORRECT,
      });
    }

    const newHash = await hashPassword(newPassword);
    await connection.execute('UPDATE employees SET password_hash = ? WHERE employee_id = ?', [
      newHash,
      user.employee_id,
    ]);
    await markAllResetTokensUsed(user.employee_id, connection);
    await revokeAllSessionsForEmployee(user.employee_id, connection);
    await recordAuthEvent(
      AUTH_EVENT.PASSWORD_CHANGED,
      { ...requestInfo, employeeId: user.employee_id },
      connection,
    );
  });
}

export async function forgotPasswordService({ email }, requestInfo) {
  const [rows] = await pool.execute(
    'SELECT employee_id, first_name, active FROM employees WHERE email = ?',
    [email],
  );
  const employee = rows[0];

  await recordAuthEvent(AUTH_EVENT.RESET_REQUESTED, {
    ...requestInfo,
    employeeId: employee ? employee.employee_id : null,
    emailAttempted: email,
  });

  if (!employee || !employee.active) {
    await hashPassword('timing-padding-for-unknown-accounts');
    return;
  }

  const rawToken = generateRandomToken();
  await withTransaction(async (connection) => {
    await connection.execute('SELECT employee_id FROM employees WHERE employee_id = ? FOR UPDATE', [
      employee.employee_id,
    ]);
    await markAllResetTokensUsed(employee.employee_id, connection);
    await connection.execute(
      `INSERT INTO password_reset_tokens (employee_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(6), INTERVAL ? SECOND))`,
      [employee.employee_id, hashToken(rawToken), RESET_TOKEN_TTL_SECONDS],
    );
  });

  const resetUrl = new URL('/reset-password', env.frontendUrl);
  resetUrl.searchParams.set('token', rawToken);
  await sendPasswordResetEmail({
    to: email,
    firstName: employee.first_name,
    resetUrl: resetUrl.toString(),
    expiresInMinutes: Math.round(env.auth.resetTokenTtlMs / 60000),
  });
}

export async function resetPasswordService({ token, newPassword }, requestInfo) {
  const invalidLink = () =>
    new BadRequestError('Invalid or expired reset link', { code: ERROR_CODES.INVALID_RESET_LINK });

  await withTransaction(async (connection) => {
    const [candidates] = await connection.execute(
      'SELECT reset_id, employee_id FROM password_reset_tokens WHERE token_hash = ?',
      [hashToken(token)],
    );
    const candidate = candidates[0];
    if (!candidate) {
      await recordAuthEvent(AUTH_EVENT.RESET_REJECTED, requestInfo, connection);
      throw invalidLink();
    }

    const [employees] = await connection.execute(
      'SELECT employee_id, active FROM employees WHERE employee_id = ? FOR UPDATE',
      [candidate.employee_id],
    );
    const [tokens] = await connection.execute(
      `SELECT reset_id FROM password_reset_tokens
       WHERE reset_id = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP(6) FOR UPDATE`,
      [candidate.reset_id],
    );
    const employee = employees[0];
    if (!employee || !employee.active || !tokens.length) {
      await recordAuthEvent(
        AUTH_EVENT.RESET_REJECTED,
        { ...requestInfo, employeeId: candidate.employee_id },
        connection,
      );
      throw invalidLink();
    }

    const newHash = await hashPassword(newPassword);
    await connection.execute('UPDATE employees SET password_hash = ? WHERE employee_id = ?', [
      newHash,
      employee.employee_id,
    ]);
    await markAllResetTokensUsed(employee.employee_id, connection);
    await revokeAllSessionsForEmployee(employee.employee_id, connection);
    await recordAuthEvent(
      AUTH_EVENT.RESET_COMPLETED,
      { ...requestInfo, employeeId: employee.employee_id },
      connection,
    );
  });
}
