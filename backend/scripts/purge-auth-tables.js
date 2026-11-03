import { pool } from '../src/config/db.js';
import { purgeExpiredAuthRows } from '../src/shared/auth/cleanup.js';

try {
  const removed = await purgeExpiredAuthRows();
  console.log('Removed expired rows:', removed);
} catch (error) {
  console.error('Purge failed:', error.code || error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
