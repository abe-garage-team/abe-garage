import { UnauthorizedError, ForbiddenError, ERROR_CODES } from '../../../utils/errors/index.js';
import { verifyPassword, verifyAgainstDummyHash } from '../../../shared/auth/passwords.js';
import { AUTH_EVENT, recordAuthEvent } from '../../../shared/auth/auth-events.js';
import {
  createSessionForEmployee,
  revokeSessionById,
} from '../../../shared/sessions/session.store.js';
import { findEmployeeWithPasswordByEmail } from '../../../shared/employees/employee.queries.js';
import { toPublicEmployee } from '../../../shared/employees/employee.presenter.js';

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
