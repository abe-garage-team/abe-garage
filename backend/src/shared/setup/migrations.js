import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listMigrations, splitSqlStatements } from '../../../scripts/migration-utils.js';

const backendRoot = fileURLToPath(new URL('../../../', import.meta.url));
export const migrationsDirectory = path.join(backendRoot, 'db/migrations');
export const baselineSchemaPath = path.join(backendRoot, 'db/schema.sql');

export async function ensureMigrationLedger(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

export async function listPendingMigrations(connection) {
  await ensureMigrationLedger(connection);
  const migrations = listMigrations(migrationsDirectory);
  const [appliedRows] = await connection.query('SELECT version, name FROM schema_migrations');
  const appliedByVersion = new Map(appliedRows.map((row) => [row.version, row.name]));

  for (const migration of migrations) {
    const appliedName = appliedByVersion.get(migration.version);
    if (appliedName && appliedName !== migration.file) {
      throw new Error(
        `Migration ${migration.version} was recorded as ${appliedName}, not ${migration.file}. Do not rename applied migrations.`,
      );
    }
  }
  return {
    applied: appliedRows.length,
    pending: migrations.filter((migration) => !appliedByVersion.has(migration.version)),
  };
}

export async function applyPendingMigrations(connection, report = () => {}) {
  const { pending } = await listPendingMigrations(connection);
  for (const migration of pending) {
    const statements = splitSqlStatements(fs.readFileSync(migration.path, 'utf8'));
    if (!statements.length) throw new Error(`Migration has no executable SQL: ${migration.file}`);
    report(`Applying ${migration.file}`);
    for (const statement of statements) await connection.query(statement);
    await connection.execute('INSERT INTO schema_migrations (version, name) VALUES (?, ?)', [
      migration.version,
      migration.file,
    ]);
  }
  return pending.length;
}

export async function baselineTablesExist(connection) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = 'roles'`,
  );
  return Number(rows[0].count) > 0;
}

export async function applyBaselineSchema(connection) {
  const statements = splitSqlStatements(fs.readFileSync(baselineSchemaPath, 'utf8'));
  for (const statement of statements) await connection.query(statement);
}
