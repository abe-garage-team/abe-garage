# Incremental migrations

Baseline: `../schema.sql`. Do not re-run the baseline against an existing database.

- Add reviewed, append-only files named `NNN_short_description.sql`, such as `002_add_customer_index.sql`.
- Never rename or edit a migration that has been applied to any shared environment.
- Run `npm run db:migrate:status` before `npm run db:migrate`. The runner serializes execution with a MySQL advisory lock and records each successful file in `schema_migrations`.
- Multiple ordinary SQL statements and MySQL `DELIMITER` blocks are supported. Use reversible, independently reviewable migrations: MySQL DDL can implicitly commit, so a failed DDL migration may require a deliberate follow-up migration rather than a blind retry.
