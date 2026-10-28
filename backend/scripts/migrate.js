import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../db/migrations');

async function runMigrations() {
  console.log('[Migrate] Checking database migrations...');
  const connection = await pool.getConnection();

  try {
    // 1. Ensure migrations ledger exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // 2. Fetch already applied versions
    const [appliedRows] = await connection.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(appliedRows.map((r) => r.version));

    // 3. Scan migrations folder for .sql files
    if (!fs.existsSync(migrationsDir)) {
      console.log('[Migrate] No migrations directory found.');
      return;
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('[Migrate] No migration files found in backend/db/migrations.');
      return;
    }

    let appliedCount = 0;
    for (const file of migrationFiles) {
      const version = file.split('_')[0] || file;
      if (appliedVersions.has(version)) {
        continue;
      }

      console.log(`[Migrate] Applying ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // Strip comments and split by semicolon for multiple statements
      const statements = sqlContent
        .split(/;\s*$/m)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await connection.beginTransaction();
      try {
        for (const statement of statements) {
          await connection.query(statement);
        }
        await connection.query('INSERT INTO schema_migrations (version, name) VALUES (?, ?)', [
          version,
          file,
        ]);
        await connection.commit();
        appliedCount++;
        console.log(`[Migrate] Successfully applied ${file}`);
      } catch (err) {
        await connection.rollback();
        console.error(`[Migrate] Failed to apply ${file}:`, err.message);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log('[Migrate] All migrations are up to date.');
    } else {
      console.log(`[Migrate] Successfully applied ${appliedCount} migration(s).`);
    }
  } finally {
    connection.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('[Migrate] Migration process terminated with error:', err.message);
  process.exit(1);
});
