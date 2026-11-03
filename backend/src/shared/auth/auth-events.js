import { pool } from '../../config/db.js';
import { logWarning } from '../../utils/log.js';

export const AUTH_EVENT = Object.freeze({
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGIN_DISABLED_ACCOUNT: 'login_disabled_account',
  LOGOUT: 'logout',
  PASSWORD_CHANGED: 'password_changed',
  RESET_REQUESTED: 'reset_requested',
  RESET_COMPLETED: 'reset_completed',
  RESET_REJECTED: 'reset_rejected',
  EMPLOYEE_CREATED: 'employee_created',
  EMPLOYEE_ROLE_CHANGED: 'employee_role_changed',
  EMPLOYEE_ACTIVE_CHANGED: 'employee_active_changed',
  INSTALL_COMPLETED: 'install_completed',
});

export async function recordAuthEvent(eventType, details = {}, connection = pool) {
  try {
    await connection.execute(
      `INSERT INTO auth_events
         (event_type, employee_id, actor_employee_id, email_attempted, ip_address, user_agent, request_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        eventType,
        details.employeeId ?? null,
        details.actorEmployeeId ?? null,
        details.emailAttempted ?? null,
        details.ipAddress ?? null,
        details.userAgent ? String(details.userAgent).slice(0, 255) : null,
        details.requestId ?? null,
      ],
    );
  } catch (error) {
    logWarning({ event: 'auth_event_not_recorded', error_name: error.name, code: error.code });
  }
}

export function requestDetails(req, extra = {}) {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.get('User-Agent') ?? null,
    requestId: req.id ?? null,
    ...extra,
  };
}
