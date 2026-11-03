import { pool } from '../../config/db.js';
import { env } from '../../config/env.js';
import { generateRandomToken, hashToken } from '../auth/tokens.js';

const SESSION_TTL_SECONDS = Math.floor(env.auth.sessionTtlMs / 1000);
const SESSION_UPDATE_AGE_SECONDS = Math.floor(env.auth.sessionUpdateAgeMs / 1000);
const SESSION_ABSOLUTE_SECONDS = Math.floor(env.auth.sessionAbsoluteMs / 1000);

export async function createSessionForEmployee(employeeId, requestInfo, connection = pool) {
  const token = generateRandomToken();
  await connection.execute(
    `INSERT INTO sessions (employee_id, token_hash, expires_at, last_seen_at, ip_address, user_agent)
     VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(6), INTERVAL ? SECOND), UTC_TIMESTAMP(6), ?, ?)`,
    [
      employeeId,
      hashToken(token),
      SESSION_TTL_SECONDS,
      requestInfo.ipAddress ?? null,
      requestInfo.userAgent ?? null,
    ],
  );
  await removeOldestSessionsOverLimit(employeeId, connection);
  const expiresAt = new Date(Date.now() + env.auth.sessionTtlMs);
  return { token, expiresAt };
}

async function removeOldestSessionsOverLimit(employeeId, connection) {
  const [rows] = await connection.execute(
    `SELECT session_id FROM sessions
     WHERE employee_id = ? AND expires_at > UTC_TIMESTAMP(6)
     ORDER BY created_at DESC, session_id DESC`,
    [employeeId],
  );
  const sessionsToRemove = rows.slice(env.auth.maxSessionsPerEmployee);
  for (const row of sessionsToRemove) {
    await connection.execute('DELETE FROM sessions WHERE session_id = ?', [row.session_id]);
  }
}

export async function findLiveSessionByToken(token) {
  const [rows] = await pool.execute(
    `SELECT s.session_id, s.employee_id, e.role_id, e.active,
            (s.expires_at < DATE_ADD(UTC_TIMESTAMP(6), INTERVAL ? SECOND)) AS needs_extension
     FROM sessions AS s
     JOIN employees AS e ON e.employee_id = s.employee_id
     WHERE s.token_hash = ?
       AND s.expires_at > UTC_TIMESTAMP(6)
       AND s.created_at > DATE_SUB(UTC_TIMESTAMP(6), INTERVAL ? SECOND)
     LIMIT 1`,
    [SESSION_UPDATE_AGE_SECONDS, hashToken(token), SESSION_ABSOLUTE_SECONDS],
  );
  return rows[0] || null;
}

export async function extendSession(sessionId) {
  await pool.execute(
    `UPDATE sessions
     SET expires_at = DATE_ADD(UTC_TIMESTAMP(6), INTERVAL ? SECOND), last_seen_at = UTC_TIMESTAMP(6)
     WHERE session_id = ?`,
    [SESSION_TTL_SECONDS, sessionId],
  );
  return new Date(Date.now() + env.auth.sessionTtlMs);
}

export async function touchSession(sessionId) {
  await pool.execute('UPDATE sessions SET last_seen_at = UTC_TIMESTAMP(6) WHERE session_id = ?', [
    sessionId,
  ]);
}

export async function revokeSessionById(sessionId, connection = pool) {
  await connection.execute('DELETE FROM sessions WHERE session_id = ?', [sessionId]);
}

export async function revokeAllSessionsForEmployee(employeeId, connection = pool) {
  await connection.execute('DELETE FROM sessions WHERE employee_id = ?', [employeeId]);
}

export async function deleteExpiredSessions(connection = pool) {
  const [result] = await connection.execute(
    `DELETE FROM sessions
     WHERE expires_at <= UTC_TIMESTAMP(6)
        OR created_at <= DATE_SUB(UTC_TIMESTAMP(6), INTERVAL ? SECOND)`,
    [SESSION_ABSOLUTE_SECONDS],
  );
  return result.affectedRows;
}
