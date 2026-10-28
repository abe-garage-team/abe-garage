# Contributing to Abe Garage

Thank you for contributing to Abe Garage.

## Basic Guidelines

- Keep changes focused and understandable.
- Follow the existing coding style and project structure.
- Test your changes before submitting them.
- Never commit passwords, API keys, database credentials, or real `.env` files.
- Communicate with the relevant team members when a change affects shared code or interfaces.

## Git Workflow

- `main`: stable code intended for releases and demonstrations.
- `dev`: integration branch for completed features.
- `feat/<short-description>`: branch for a new feature.
- `fix/<short-description>`: branch for a bug fix.

Before the first feature branch, a maintainer creates and pushes `dev` from `main`. Create feature and fix branches from `dev`; when your work is ready, open a pull request targeting `dev`.

Changes intended for `main` should be tested before merging.

## Pull Requests

Each pull request should:

1. Have a clear title and description.
2. Explain what changed and why.
3. Reference a related issue when one exists.
4. Include relevant testing information.
5. Identify any known limitations or follow-up work.

Reviewers should check correctness, readability, security, and compatibility with existing code.

## Code Quality & Linting

Before opening a pull request, ensure all linting and format checks pass:

- Run `npm run lint` to check for syntax and JavaScript errors.
- Run `npm run format:check` (or `npm run format` to automatically format files with Prettier).
- Run `npm run check:structure` to ensure routes, endpoints, and file dependencies are intact.
- Run `npm test` to run all backend and frontend unit/integration test suites.

## Database Migrations

Never modify `schema.sql` directly after the baseline has been initialized.

- Add new schema changes as numbered SQL files in `backend/db/migrations/` (e.g. `002_add_column.sql`).
- Apply migrations by running `npm run db:migrate`.
- Migration state is automatically tracked in the `schema_migrations` table.

## API Contracts & Single Source of Truth

[`docs/api/contracts.json`](docs/api/contracts.json) is the authoritative machine-readable contract for all endpoints. [`docs/api/openapi.json`](docs/api/openapi.json) is a generated artifact and must not be edited by hand.

- Run `npm run generate:openapi` after a contract change, then commit both files.
- `npm run check:openapi` verifies that the generated file is current.

## Frontend Architecture & API Ownership

- **UI Pages & Components**: Live in `frontend/src/features/<domain>/`.
- **API Services**: All HTTP communication lives in `frontend/src/services/<domain>.service.js`, utilizing `core/api-client.js`.
- Do not make raw `fetch()` calls directly inside React components.

## Security

- Keep secrets in environment variables.
- Use parameterized SQL queries.
- Do not expose private customer or employee information through public endpoints.
- Report security concerns privately to the repository maintainers rather than publishing sensitive details in an issue.

## Collaboration

Respect each member's responsibilities, communicate changes that affect shared work, and coordinate before making incompatible changes to shared interfaces or database structures.
