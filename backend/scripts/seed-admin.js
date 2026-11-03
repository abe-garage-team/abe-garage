import { pool, withTransaction } from '../src/config/db.js';
import { readInitialSeedFromEnv, seedInitialData } from '../src/shared/setup/initial-seed.js';

try {
  const seed = readInitialSeedFromEnv();
  const result = await withTransaction((connection) => seedInitialData(connection, seed));
  console.log('Seed complete:', result, 'Existing Admin/settings were not overwritten.');
} catch (error) {
  console.error(
    'Seed failed:',
    error.code || error.name,
    error.code ? 'Check schema and uniqueness constraints.' : error.message,
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
