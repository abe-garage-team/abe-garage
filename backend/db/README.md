# Database

The authoritative initial schema is schema.sql (14 normalized tables, 5 views). Run it once on an empty MySQL 8.0.16+ database using MySQL CLI/Workbench. Do not run the obsolete ten-table proposal.

Future incremental schema changes go in migrations/ after team review. Never re-run schema.sql over an existing schema. To apply pending migrations, run `npm run db:migrate` (or `npm run db:migrate --workspace backend`). Applied migrations are tracked in the `schema_migrations` ledger table.

The initial Admin/settings CLI is implemented in scripts/seed-admin.js. Set INITIAL_ADMIN_* and garage contact fields in backend/.env, then run npm run seed:admin from the root. It preserves an existing active Admin/settings. A live MySQL environment is required to verify the schema and seed; routing tests do not do that.

See ../../docs/database/README.md for mappings and constraints.
