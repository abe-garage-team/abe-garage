# Backend

Entry point: `index.js`. It registers shared middleware (request id, helmet, CORS with credentials, JSON body limit, cookie parser, origin check) and mounts only `mainRouter` at `/api`.

`src/api/routes.js` imports feature routers and mounts their prefixes. Feature `.route.js` files declare local paths: auth is mounted at `/auth` and its login path is `/login`.

## Implemented (BE-01)

Authentication (login, logout, change/forgot/reset password), profile, employees, roles, settings, installation and health. Read [docs/api/AUTH-DESIGN.md](../docs/api/AUTH-DESIGN.md) before touching anything under `src/middleware` or `src/shared/auth`.

Folder map:

| Folder                      | Contents                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `src/middleware`            | authentication, authorization (`hasRole`), csrf, validators, rate limits, error handler |
| `src/shared/auth`           | password hashing, tokens, auth events, reset tokens, cleanup job                        |
| `src/shared/sessions`       | session table access and the session cookie                                             |
| `src/shared/rate-limit`     | database-backed hit counters                                                            |
| `src/shared/notifications`  | email sending (`MAIL_ADAPTER=smtp` or `fake`)                                           |
| `src/shared/setup`          | migrations runner and initial seed shared by CLI scripts and `/api/install`             |
| `src/utils/errors`          | `AppError` and typed subclasses                                                         |
| `src/constants/error-codes` | the `code` values in error responses                                                    |

Other module folders (customers, orders, ...) remain placeholders. Choose your own function names; keep centralized errors and server-side permission checks.

## Scripts

```
npm run dev                 start with file watching
npm run db:setup            create the database, load schema.sql, migrate, seed Admin and fixtures (development only)
npm run db:migrate          apply pending migrations (schema.sql must be loaded first)
npm run db:migrate:status   list pending migrations
npm run seed:admin          create the first Admin and garage settings from .env
npm run seed:development    add sample employees, customers, vehicles and services
npm run db:purge-auth       delete expired sessions, rate-limit windows and reset tokens
npm test                    unit + routing tests; integration tests run when MySQL is reachable
```

Set `DATABASE_INTEGRATION=true` to make the integration tests fail instead of skip when MySQL is unavailable. The integration tests expect the seeded Admin from `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` and `MAIL_ADAPTER=fake`.

Read ../docs/TEAM-GUIDE.md, ../docs/ROUTING.md and ../docs/database/README.md. The baseline schema is `db/schema.sql`; later changes are numbered files in `db/migrations`.
