# Abe Garage

A modular full-stack foundation for a four-person garage-management team. It contains the agreed API contracts, normalized MySQL schema, Express/React project structure, quality checks, and placeholders for feature owners to implement.

Only `GET /api/health` and the initial Admin/settings seed are implemented. The remaining endpoints and UI pages are deliberate placeholders, not completed features.

## Stack

- React 18 and Vite
- Node.js 22 and Express
- MySQL 8.0.16 or later
- npm workspaces

## First-time setup

Use the Node version in `.nvmrc`, then run the following from the repository root:

```powershell
npm ci
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Set the database, JWT, initial Admin, and garage values in `backend/.env`. Create an empty MySQL database, then load the baseline schema and apply migrations:

```powershell
# Replace abe_garage with the database you created.
Get-Content -Raw backend/db/schema.sql | mysql -u root -p -D abe_garage
npm run db:migrate
npm run seed:admin
npm run dev
```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:5000/api`.

## Quality checks

```powershell
npm run check
```

This verifies project structure, API-contract/OpenAPI synchronization, linting, formatting, backend/frontend tests, and the frontend production build. For database work, use `npm run db:migrate:status` before `npm run db:migrate`.

## Team conventions

- [`docs/api/contracts.json`](docs/api/contracts.json) is the machine-readable API source of truth. Generate [`docs/api/openapi.json`](docs/api/openapi.json) with `npm run generate:openapi`; do not edit it manually.
- Add future database changes as reviewed, numbered files in [`backend/db/migrations`](backend/db/migrations/README.md). Never modify an applied migration or re-run the baseline schema over an existing database.
- Keep React pages/components inside `frontend/src/features/<domain>` and API wrappers in `frontend/src/services/<domain>.service.js`. Components must not call `fetch()` directly.
- Read [CONTRIBUTING.md](CONTRIBUTING.md), [the team guide](docs/TEAM-GUIDE.md), and [the database design](docs/database/README.md) before implementing a feature.

## Status

This is an implementation-ready scaffold, not a deployable finished system. Complete and test each API/UI feature before presenting or deploying it.
