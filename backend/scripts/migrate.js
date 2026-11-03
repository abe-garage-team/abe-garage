import { pool } from '../src/config/db.js';
import { listPendingMigrations, applyPendingMigrations } from '../src/shared/setup/migrations.js';

const lockName = 'abe_garage_schema_migrations';

async function main() {
  const statusOnly = process.argv.includes('--status');
  const unknownArguments = process.argv.slice(2).filter((argument) => argument !== '--status');
  if (unknownArguments.length) throw new Error(`Unknown argument: ${unknownArguments.join(', ')}`);

  let connection;
  let lockAcquired = false;
  try {
    connection = await pool.getConnection();
    const [lockRows] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
    if (Number(lockRows[0]?.acquired) !== 1) {
      throw new Error('Could not acquire the migration lock within 10 seconds');
    }
    lockAcquired = true;

    if (statusOnly) {
      const { applied, pending } = await listPendingMigrations(connection);
      console.log(`Applied migrations: ${applied}`);
      console.log(`Pending migrations: ${pending.length}`);
      for (const migration of pending) console.log(`  pending ${migration.file}`);
      return;
    }

    const appliedCount = await applyPendingMigrations(connection, (message) =>
      console.log(`[migrate] ${message}`),
    );
    console.log(
      appliedCount ? `[migrate] Applied ${appliedCount} migration(s).` : '[migrate] Up to date.',
    );
  } finally {
    if (connection && lockAcquired) await connection.query('SELECT RELEASE_LOCK(?)', [lockName]);
    connection?.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`[migrate] ${error.message}`);
  process.exitCode = 1;
});
