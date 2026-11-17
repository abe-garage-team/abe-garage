import { pool } from '../../../config/db.js';
import {
  AppError,
  ForbiddenError,
  ServiceUnavailableError,
  ERROR_CODES,
} from '../../../utils/errors/index.js';
import {
  applyBaselineSchema,
  applyPendingMigrations,
  baselineTablesExist,
} from '../../../shared/setup/migrations.js';
import { readInitialSeedFromEnv, seedInitialData } from '../../../shared/setup/initial-seed.js';

export async function healthService() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query({
      sql: 'SELECT (SELECT COUNT(*) FROM roles) AS roles_count, (SELECT COUNT(*) FROM garage_settings WHERE settings_id = 1) AS settings_count, (SELECT COUNT(*) FROM employees WHERE role_id = 3 AND active = 1) AS admin_count',
      timeout: 3000,
    });
    if (rows[0].roles_count !== 3 || rows[0].settings_count !== 1 || rows[0].admin_count < 1)
      throw new Error('Not initialized');
    await connection.query({ sql: 'SELECT order_id FROM v_orders LIMIT 0', timeout: 3000 });
    return { service: 'abe-garage-api', ready: true };
  } catch {
    throw new AppError('Service unavailable', 503, { ready: false });
  } finally {
    connection?.release();
  }
}

const INSTALL_LOCK_NAME = 'abe_garage_install';

async function isInstalled(connection) {
  try {
    const [rows] = await connection.query('SELECT setup_id FROM app_setup WHERE setup_id = 1');
    return rows.length > 0;
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') return false; // migrations not applied yet
    throw error;
  }
}

export async function installService() {
  let seed;
  try {
    seed = readInitialSeedFromEnv(); // a bad .env fails here, before the database is touched
  } catch (error) {
    throw new ServiceUnavailableError(`Installation cannot run: ${error.message}`);
  }

  const connection = await pool.getConnection();
  try {
    // One installer at a time: a second caller gets 503 instead of racing the first.
    const [[{ locked }]] = await connection.query('SELECT GET_LOCK(?, 0) AS locked', [
      INSTALL_LOCK_NAME,
    ]);
    if (locked !== 1) {
      throw new ServiceUnavailableError('Installation currently running', {
        code: ERROR_CODES.INSTALL_IN_PROGRESS,
      });
    }
    try {
      if (await isInstalled(connection)) {
        throw new ForbiddenError('Installation is locked', { code: ERROR_CODES.INSTALL_LOCKED });
      }

      // DDL commits by itself in MySQL, so tables and migrations run first, outside the transaction.
      if (!(await baselineTablesExist(connection))) await applyBaselineSchema(connection);
      await applyPendingMigrations(connection);

      // Seed and the lock row succeed or fail together.
      await connection.beginTransaction();
      try {
        const result = await seedInitialData(connection, seed);
        await connection.execute(
          "INSERT INTO app_setup (setup_id, installed_by) VALUES (1, 'install-endpoint')",
        );
        await connection.commit();
        return {
          installed: true,
          roles_created: result.rolesCount,
          admin_created: result.adminCreated,
        };
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    } finally {
      await connection.query('SELECT RELEASE_LOCK(?)', [INSTALL_LOCK_NAME]);
    }
  } finally {
    connection.release();
  }
}
