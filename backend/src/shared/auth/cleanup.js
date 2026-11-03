import { deleteExpiredSessions } from '../sessions/session.store.js';
import { deleteExpiredRateLimits } from '../rate-limit/rate-limit.store.js';
import { pool } from '../../config/db.js';
import { logInfo, logWarning } from '../../utils/log.js';

export async function purgeExpiredAuthRows() {
  const sessions = await deleteExpiredSessions();
  const rateLimits = await deleteExpiredRateLimits();
  const [resetResult] = await pool.execute(
    `DELETE FROM password_reset_tokens
     WHERE used_at IS NOT NULL OR expires_at <= UTC_TIMESTAMP(6)`,
  );
  return { sessions, rateLimits, resetTokens: resetResult.affectedRows };
}

const ONE_HOUR = 60 * 60 * 1000;

export function startAuthTableCleanup() {
  const run = async () => {
    try {
      const removed = await purgeExpiredAuthRows();
      logInfo({ event: 'auth_cleanup', ...removed });
    } catch (error) {
      logWarning({ event: 'auth_cleanup_failed', error_name: error.name, code: error.code });
    }
  };
  const firstRun = setTimeout(run, 10000);
  firstRun.unref();
  const repeat = setInterval(run, ONE_HOUR);
  repeat.unref();
  return () => {
    clearTimeout(firstRun);
    clearInterval(repeat);
  };
}
