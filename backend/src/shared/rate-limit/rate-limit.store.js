import { pool } from '../../config/db.js';
import { hashRateLimitKey } from '../auth/tokens.js';

export class MySqlRateLimitStore {
  constructor({ prefix }) {
    this.prefix = prefix;
    this.windowMs = 0;
    this.localKeys = false;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const keyHash = hashRateLimitKey([this.prefix, key]);
    const windowSeconds = Math.ceil(this.windowMs / 1000);
    await pool.execute(
      `INSERT INTO auth_rate_limits (key_hash, hit_count, window_ends_at)
       VALUES (?, 1, DATE_ADD(UTC_TIMESTAMP(6), INTERVAL ? SECOND))
       ON DUPLICATE KEY UPDATE
         hit_count = IF(window_ends_at <= UTC_TIMESTAMP(6), 1, hit_count + 1),
         window_ends_at = IF(window_ends_at <= UTC_TIMESTAMP(6),
                             DATE_ADD(UTC_TIMESTAMP(6), INTERVAL ? SECOND),
                             window_ends_at)`,
      [keyHash, windowSeconds, windowSeconds],
    );
    const [rows] = await pool.execute(
      'SELECT hit_count, window_ends_at FROM auth_rate_limits WHERE key_hash = ?',
      [keyHash],
    );
    const row = rows[0];
    return { totalHits: Number(row.hit_count), resetTime: new Date(row.window_ends_at) };
  }

  async decrement(key) {
    const keyHash = hashRateLimitKey([this.prefix, key]);
    await pool.execute(
      'UPDATE auth_rate_limits SET hit_count = GREATEST(hit_count - 1, 0) WHERE key_hash = ?',
      [keyHash],
    );
  }

  async resetKey(key) {
    const keyHash = hashRateLimitKey([this.prefix, key]);
    await pool.execute('DELETE FROM auth_rate_limits WHERE key_hash = ?', [keyHash]);
  }
}

export async function deleteExpiredRateLimits(connection = pool) {
  const [result] = await connection.execute(
    'DELETE FROM auth_rate_limits WHERE window_ends_at <= UTC_TIMESTAMP(6)',
  );
  return result.affectedRows;
}
