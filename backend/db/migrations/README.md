# Incremental migrations

Baseline: ../schema.sql. Add future reviewed changes as `002_short_description.sql`, `003_short_description.sql`, etc. Run `npm run db:migrate` from the project root to automatically apply unapplied migrations and record them in the `schema_migrations` ledger table.
