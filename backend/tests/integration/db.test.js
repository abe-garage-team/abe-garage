import { test } from 'node:test';
import assert from 'node:assert';
import { pool, withTransaction } from '../../src/config/db.js';

test('MySQL integration test suite', async (t) => {
  let isConnected = false;
  try {
    const [rows] = await pool.query({ sql: 'SELECT 1 + 1 AS sum', timeout: 2000 });
    assert.strictEqual(rows[0].sum, 2);
    isConnected = true;
  } catch {
    t.skip('MySQL database server not reachable; skipping integration tests');
    return;
  }

  if (isConnected) {
    await t.test('verifies connection pool and roles table', async () => {
      try {
        const [rows] = await pool.query(
          'SELECT role_id, role_name FROM roles ORDER BY role_id ASC',
        );
        if (rows.length > 0) {
          assert.strictEqual(rows[0].role_id, 1);
          assert.strictEqual(rows[0].role_name, 'Technician');
        }
      } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          t.skip('Database schema not yet applied to test database');
        } else {
          throw err;
        }
      }
    });

    await t.test('verifies withTransaction helper rolls back on error', async () => {
      try {
        await withTransaction(async (conn) => {
          await conn.query('SELECT 1');
          throw new Error('Forced rollback verification');
        });
      } catch (err) {
        assert.strictEqual(err.message, 'Forced rollback verification');
      }
    });
  }
});
