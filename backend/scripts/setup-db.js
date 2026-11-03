import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';
import {
  applyBaselineSchema,
  applyPendingMigrations,
  baselineTablesExist,
  ensureMigrationLedger,
} from '../src/shared/setup/migrations.js';
import { readInitialSeedFromEnv, seedInitialData } from '../src/shared/setup/initial-seed.js';
import { seedDevelopmentData } from './seed-development.js';

const withFixtures = !process.argv.includes('--no-fixtures');

if (env.nodeEnv === 'production') {
  throw new Error(
    'db:setup is for local development only. Use db:migrate and seed:admin in production.',
  );
}

const { database, connectionLimit, ...serverConfig } = env.db;

if (!serverConfig.user) {
  console.error('Set DB_USER and DB_PASSWORD in backend/.env to your MySQL login, then run again.');
  process.exit(1);
}

let server;
try {
  server = await mysql.createConnection(serverConfig);
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.error(
      `MySQL is not reachable at ${serverConfig.host}:${serverConfig.port}. Start MySQL and run again.`,
    );
  } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('MySQL refused the login. Check DB_USER and DB_PASSWORD in backend/.env.');
  } else {
    console.error(error.message);
  }
  process.exit(1);
}
try {
  await server.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
  );
  console.log(`Database ${database} is ready`);
} finally {
  await server.end();
}

const connection = await mysql.createConnection({ ...serverConfig, database, timezone: 'Z' });
try {
  await connection.query("SET time_zone = '+00:00'");

  if (await baselineTablesExist(connection)) {
    console.log('Schema already present, skipping schema.sql');
  } else {
    await applyBaselineSchema(connection);
    console.log('Applied backend/db/schema.sql');
  }

  await ensureMigrationLedger(connection);
  const applied = await applyPendingMigrations(connection, (message) => console.log(message));
  console.log(applied ? `Applied ${applied} migration(s)` : 'Migrations are up to date');

  await connection.beginTransaction();
  const seed = await seedInitialData(connection, readInitialSeedFromEnv());
  await connection.commit();
  console.log(
    seed.adminCreated
      ? `Created Admin ${process.env.INITIAL_ADMIN_EMAIL}`
      : 'Admin already exists, kept as is',
  );

  if (withFixtures) {
    const fixtures = await seedDevelopmentData(connection);
    console.log(
      fixtures.created
        ? 'Added development fixtures (employees, customers, vehicles, services)'
        : 'Development fixtures already present',
    );
  }

  console.log('');
  console.log('Done. Start the API with: npm run dev:backend');
  console.log(`Login in Postman: ${process.env.INITIAL_ADMIN_EMAIL} / your INITIAL_ADMIN_PASSWORD`);
} catch (error) {
  await connection.rollback().catch(() => {});
  throw error;
} finally {
  await connection.end();
}
