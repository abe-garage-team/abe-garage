import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/config/db.js';
import { listMigrations, splitSqlStatements } from './migration-utils.js';

const __filename = fileURLToPath(import.meta.url);
const migrationsDir = path.resolve(path.dirname(__filename), '../db/migrations');
const lockName = 'abe_garage_schema_migrations';

async function ensureLedger(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

async function main() {
  const statusOnly = process.argv.includes('--status');
  const unknownArguments = process.argv.slice(2).filter((argument) => argument !== '--status');
  if (unknownArguments.length) throw new Error(`Unknown argument: ${unknownArguments.join(', ')}`);
  if (!fs.existsSync(migrationsDir)) throw new Error('Missing backend/db/migrations directory');

  let connection;
  let lockAcquired = false;
  try {
    connection = await pool.getConnection();
    const [lockRows] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
    if (Number(lockRows[0]?.acquired) !== 1) {
      throw new Error('Could not acquire the migration lock within 10 seconds');
    }
    lockAcquired = true;

    await ensureLedger(connection);
    const migrations = listMigrations(migrationsDir);
    const [appliedRows] = await connection.query(
      'SELECT version, name FROM schema_migrations ORDER BY version',
    );
    const appliedByVersion = new Map(appliedRows.map((row) => [row.version, row.name]));
    for (const migration of migrations) {
      const appliedName = appliedByVersion.get(migration.version);
      if (appliedName && appliedName !== migration.file) {
        throw new Error(
          `Migration ${migration.version} was recorded as ${appliedName}, not ${migration.file}. Do not rename applied migrations.`,
        );
      }
    }

    const pending = migrations.filter((migration) => !appliedByVersion.has(migration.version));
    if (statusOnly) {
      console.log(`Applied migrations: ${appliedRows.length}`);
      console.log(`Pending migrations: ${pending.length}`);
      for (const migration of pending) console.log(`  pending ${migration.file}`);
      return;
    }

    for (const migration of pending) {
      const statements = splitSqlStatements(fs.readFileSync(migration.path, 'utf8'));
      if (!statements.length) throw new Error(`Migration has no executable SQL: ${migration.file}`);
      console.log(`[migrate] Applying ${migration.file}`);
      await connection.beginTransaction();
      try {
        for (const statement of statements) await connection.query(statement);
        await connection.execute('INSERT INTO schema_migrations (version, name) VALUES (?, ?)', [
          migration.version,
          migration.file,
        ]);
        await connection.commit();
      } catch (error) {
        try {
          await connection.rollback();
        } catch {
          // Preserve the migration error.
        }
        throw new Error(`Migration ${migration.file} failed: ${error.message}`, { cause: error });
      }
    }
    console.log(
      pending.length
        ? `[migrate] Applied ${pending.length} migration(s).`
        : '[migrate] Up to date.',
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
