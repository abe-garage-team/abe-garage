# Abe Garage

A modular full-stack foundation for a four-person garage-management team. It contains the agreed API contracts, normalized MySQL schema, Express/React project structure, quality checks, and placeholders for feature owners to implement.

Implemented so far: authentication (session cookies), employees, roles and settings, install and health, customers, vehicles and orders. Services, invoices, tracking and the dashboard are placeholders for their owners.

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

## Commands

| Command                                            | What it does                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run dev`                                      | API on :5000 and frontend on :5173, both with reload                                       |
| `npm run check`                                    | Structure, OpenAPI sync, lint, format, tests and frontend build; must be green before a PR |
| `npm run db:setup`                                 | Local one-command database setup with fixtures (development only)                          |
| `npm run db:migrate:status` / `npm run db:migrate` | Show, then apply pending migrations                                                        |
| `npm run seed:admin`                               | Create the first Admin from `INITIAL_ADMIN_*`                                              |
| `npm run generate:openapi`                         | Regenerate `docs/api/openapi.json` from `contracts.json`                                   |
| `npm start`                                        | Run the API for production (`backend/index.js`)                                            |

## Environment variables

All variables live in `backend/.env` (`backend/.env.example` has development defaults). The ones a
developer touches:

| Variable                                                                                              | Purpose                                                                                  |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `DB_USER`, `DB_PASSWORD`, `DB_PORT`                                                                   | Your local MySQL login                                                                   |
| `AUTH_TOKEN_PEPPER`                                                                                   | Secret used to sign session cookies and hash rate-limit keys (32+ characters)            |
| `SESSION_TTL_HOURS`, `SESSION_UPDATE_AGE_HOURS`, `SESSION_ABSOLUTE_HOURS`, `SESSION_MAX_PER_EMPLOYEE` | Session lifetime rules (12 h idle, 2 h refresh window, 7 days absolute, 10 per employee) |
| `FRONTEND_URL`, `CORS_ORIGIN`                                                                         | The frontend origin; CSRF origin check and CORS use them                                 |
| `MAIL_ADAPTER`                                                                                        | `fake` logs emails to the console in development; `smtp` sends them                      |
| `INITIAL_ADMIN_*`, `GARAGE_*`                                                                         | Values for the first Admin and the settings row                                          |
| `INSTALL_ENABLED`, `INSTALL_SECRET`                                                                   | The one-time install endpoint; keep disabled locally                                     |

The full list with production values is in [docs/deployment/README.md](docs/deployment/README.md).

## API endpoints by task

All routes are under `/api`. Specs live in `docs/api/<module>/`.

| Task            | Method and path                                                                               | Who                                         |
| --------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------- |
| BE-004          | `POST /auth/login`, `POST /auth/logout`                                                       | anyone / logged in                          |
| BE-005, BE-006  | `POST /auth/forgot-password`, `POST /auth/reset-password`                                     | anyone                                      |
| BE-007          | `PATCH /auth/password`                                                                        | logged in                                   |
| BE-008          | `GET /profile`                                                                                | logged in                                   |
| BE-009 – BE-012 | `POST /employees`, `GET /employees`, `GET /employees/:id`, `PATCH /employees/:id`             | Admin (Manager may list active technicians) |
| BE-013          | `GET /roles`                                                                                  | Admin                                       |
| BE-014, BE-015  | `GET /settings`, `PATCH /settings`                                                            | Admin                                       |
| BE-016 – BE-019 | `/customers`, `/customers/:id`, `/customers/:id/vehicles`                                     | staff                                       |
| BE-020 – BE-024 | `/vehicles`, `/vehicles/:id`, `/vehicles/:id/orders`                                          | staff                                       |
| BE-029 – BE-034 | `/orders`, `/orders/:id`, `/orders/:id/lines`, `/orders/:id/approval`, `/orders/:id/estimate` | staff                                       |
| BE-047, BE-048  | `POST /install` (one-time, `X-Setup-Key`), `GET /health`                                      | operator / anyone                           |

Every response is `{ status, message, data }`; errors add `code`. Logged-in means a valid
`abe_session` cookie; the frontend sends it with `credentials: 'include'`.

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

## Deployment

[docs/deployment/README.md](docs/deployment/README.md) is the runbook: environment, first install (CLI or `POST /api/install`), health checks, verification, later releases and rollback.

## Status

Backend modules are implemented one task per pull request; see the table above for what exists. Complete and test each remaining feature before presenting or deploying it.
