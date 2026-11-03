# Abe Garage

A modular full-stack foundation for a four-person garage-management team. It contains the agreed API contracts, normalized MySQL schema, Express/React project structure, quality checks, and placeholders for feature owners to implement.

Authentication (login, logout, password reset and change, profile), customers and vehicles are implemented. The remaining endpoints and UI pages are placeholders for their owners.

## Stack

- React 18 and Vite
- Node.js 22 and Express
- MySQL 8.0.16 or later
- npm workspaces

## First-time setup

Use the Node version in `.nvmrc` and have MySQL 8 running locally. From the repository root:

```powershell
npm ci
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Open `backend/.env` and set `DB_USER` and `DB_PASSWORD` to your MySQL login. Everything else already has a development value. Then:

```powershell
npm run db:setup
npm run dev
```

`db:setup` creates the `abe_garage` database if it is missing, loads `backend/db/schema.sql`, applies pending migrations, seeds the Admin from `INITIAL_ADMIN_*`, and adds development fixtures (a manager, two technicians, three customers, four vehicles, four services). Running it again is safe; it skips what already exists. Use `npm run db:setup -- --no-fixtures` for an empty garage.

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:5000/api`.

## Testing the API with Postman

1. Import `postman/Abe-Garage.postman_collection.json` and `postman/local.environment.example.json`, then select the "Abe Garage local" environment.
2. Send **Auth → Login**. Postman stores the session cookie; every other request now works.
3. Add your own module's requests to the collection and run them before opening a PR.

Development logins (all with password `Password123!`): `admin@abegarage.com`, `manager@abegarage.com`, `tech1@abegarage.com`, `tech2@abegarage.com`.

## Quality checks

```powershell
npm run check
```

This verifies project structure, API-contract/OpenAPI synchronization, linting, formatting, backend/frontend tests, and the frontend production build. For database changes after the first setup, use `npm run db:migrate:status` before `npm run db:migrate`.

## Team conventions

- [`docs/api/contracts.json`](docs/api/contracts.json) is the machine-readable API source of truth. Generate [`docs/api/openapi.json`](docs/api/openapi.json) with `npm run generate:openapi`; do not edit it manually.
- Add future database changes as reviewed, numbered files in [`backend/db/migrations`](backend/db/migrations/README.md). Never modify an applied migration or re-run the baseline schema over an existing database.
- Keep React pages/components inside `frontend/src/features/<domain>` and API wrappers in `frontend/src/services/<domain>.service.js`. Components must not call `fetch()` directly.
- Read [CONTRIBUTING.md](CONTRIBUTING.md), [the team guide](docs/TEAM-GUIDE.md), and [the database design](docs/database/README.md) before implementing a feature.

## Status

This is an implementation-ready scaffold, not a deployable finished system. Complete and test each API/UI feature before presenting or deploying it.
