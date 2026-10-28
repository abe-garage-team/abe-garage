import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { pool, withTransaction } from '../../src/config/db.js';

after(async () => {
  await pool.end();
});

test('MySQL integration test suite', async (t) => {
  try {
    const [rows] = await pool.query({ sql: 'SELECT 1 + 1 AS sum', timeout: 2000 });
    assert.strictEqual(rows[0].sum, 2);
  } catch (error) {
    if (process.env.DATABASE_INTEGRATION === 'true') {
      throw new Error(`Required MySQL integration database is unreachable: ${error.message}`, {
        cause: error,
      });
    }
    t.skip('MySQL database server not reachable; skipping integration tests');
    return;
  }

  await t.test('verifies the seeded schema and migration ledger', async () => {
    const [roles] = await pool.query('SELECT role_id, role_name FROM roles ORDER BY role_id ASC');
    assert.deepEqual(roles, [
      { role_id: 1, role_name: 'Technician' },
      { role_id: 2, role_name: 'Manager' },
      { role_id: 3, role_name: 'Admin' },
    ]);
    const [migrations] = await pool.query(
      "SELECT version, name FROM schema_migrations WHERE version = '001'",
    );
    assert.deepEqual(migrations, [{ version: '001', name: '001_initial_schema_check.sql' }]);
  });

  await t.test('verifies withTransaction preserves the original failure', async () => {
    await assert.rejects(
      withTransaction(async (connection) => {
        await connection.query('SELECT 1');
        throw new Error('Forced rollback verification');
      }),
      { message: 'Forced rollback verification' },
    );
  });
});
