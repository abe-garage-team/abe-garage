# Deployment and handover (BE-050)

How to run the Abe Garage API on a real server, verify it, and roll it back. Every command and
response below was checked against the code on `main`. There are no new endpoints in this task.

## 1. What you need

- Node.js 22 (see `.nvmrc`) and npm.
- MySQL 8.0.16 or newer, reachable only from the API host, with an empty database created for the app
  (for example `abe_garage`) and a user that may create tables in it.
- An HTTPS origin for the frontend and one for the API (a reverse proxy such as nginx is the usual setup).
- Outbound SMTP from the API host: forgot-password emails are sent through it.

## 2. Environment variables

Copy `backend/.env.example` into the host's secret store and set the values below. The server refuses
to start when a required value is missing or wrong, and says which one.

| Variable                                                                                                                      | Set to                                                                                    | Checked at start-up                                                  |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `NODE_ENV`                                                                                                                    | `production`                                                                              | Turns on the secure `__Host-abe_session` cookie and SMTP requirement |
| `PORT`                                                                                                                        | the port the proxy forwards to (default `5000`)                                           |                                                                      |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`                                                                     | the production database                                                                   | `DB_USER` must be set                                                |
| `AUTH_TOKEN_PEPPER`                                                                                                           | 32+ random characters, unique to this deployment                                          | Refuses to start if shorter. Rotating it logs every employee out     |
| `SESSION_TTL_HOURS`, `SESSION_UPDATE_AGE_HOURS`, `SESSION_ABSOLUTE_HOURS`, `SESSION_MAX_PER_EMPLOYEE`                         | defaults are 12, 2, 168 and 10                                                            | Update age must be smaller than TTL                                  |
| `TRUST_PROXY`                                                                                                                 | number of reverse proxies in front of the API, usually `1`                                | Wrong values break per-IP rate limiting and the secure cookie        |
| `FRONTEND_URL`, `CORS_ORIGIN`                                                                                                 | the exact HTTPS origin of the deployed frontend, for example `https://garage.example.com` | Must be absolute URLs. CSRF origin check and CORS use them           |
| `MAIL_ADAPTER`                                                                                                                | `smtp`                                                                                    | Required in production                                               |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`                                            | your mail provider                                                                        |                                                                      |
| `GARAGE_TIMEZONE`, `CURRENCY_CODE`                                                                                            | for example `Africa/Addis_Ababa`, `ETB`                                                   |                                                                      |
| `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_FIRST_NAME`, `INITIAL_ADMIN_LAST_NAME`, `INITIAL_ADMIN_PHONE`, `INITIAL_ADMIN_PASSWORD` | the first Admin account (password 8–128 characters)                                       | Read only by the seed and the install endpoint                       |
| `GARAGE_NAME`, `GARAGE_ADDRESS`, `GARAGE_PHONE`, `GARAGE_EMAIL`                                                               | the garage settings row                                                                   | Same                                                                 |
| `INSTALL_ENABLED`, `INSTALL_SECRET`                                                                                           | `true` and a long random key only while installing over HTTP, otherwise `false`           |                                                                      |

HTTPS is mandatory: in production the session cookie is named `__Host-abe_session`, which browsers
accept only over HTTPS with `path=/`.

## 3. Install and build

From the repository root on the server:

```
npm ci --omit=dev
npm run build        # writes frontend/dist; serve it as a static site with SPA fallback to index.html
```

## 4. Create the database contents (once)

Choose one of the two. Both create the tables, apply the migrations, seed the three roles, the first
Admin and the garage settings row from the `INITIAL_ADMIN_*` and `GARAGE_*` variables.

### Option A: command line (preferred when you have a shell)

```
mysql -u <user> -p <empty_database> < backend/db/schema.sql
npm run db:migrate
npm run seed:admin
```

`npm run db:setup` is for local development only and refuses to run with `NODE_ENV=production`.

### Option B: the install endpoint (hosts without shell access)

1. Set `INSTALL_ENABLED=true` and `INSTALL_SECRET=<long random key>`, start the API (section 5).
2. Send one request:

```
curl -X POST https://api.example.com/api/install -H "X-Setup-Key: <INSTALL_SECRET>"
```

| Response                                                                 | Meaning                                                                                                  |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `201` `{ "installed": true, "roles_created": 3, "admin_created": true }` | Done. Tables, migrations, Admin, settings and the lock row exist                                         |
| `403` `SETUP_ACCESS_DENIED`                                              | Missing or wrong key. Nothing was touched                                                                |
| `403` `INSTALL_LOCKED`                                                   | Already installed. The endpoint is locked forever                                                        |
| `503` `INSTALL_IN_PROGRESS`                                              | Another install call is running; wait and retry                                                          |
| `503` `Installation cannot run: …`                                       | A `INITIAL_ADMIN_*` or `GARAGE_*` value is invalid. Fix `.env`, restart, call again; nothing was created |
| `404`                                                                    | `INSTALL_ENABLED` is not `true`                                                                          |

3. Set `INSTALL_ENABLED=false`, change `INSTALL_SECRET`, restart the API.

## 5. Run

```
npm start            # runs backend/index.js
```

Use a process manager that restarts on exit (systemd, pm2). The process checks its configuration
before listening, starts an hourly purge of expired sessions, reset tokens and rate-limit rows, and shuts
down cleanly on `SIGTERM`/`SIGINT` (stops the timer, finishes in-flight requests, closes the MySQL pool).

Readiness: `GET /api/health` returns `200 { "service": "abe-garage-api", "ready": true }` only when the
database is reachable and seeded, otherwise `503 { "ready": false }`. Point the load balancer's health
check at it.

Logs are one JSON line per event on stdout. They carry the `request_id` that every response also
returns in the `X-Request-ID` header; they never contain request bodies, cookies, passwords or tokens.
A `500` response shows the client only "Something went wrong"; the cause is in the log line with the same id.

## 6. Verify the deployment

With the Postman collection (`postman/`) pointed at the deployed API, or with curl:

1. `GET /api/health` → 200.
2. Login as the seeded Admin → 200 and a `Set-Cookie: __Host-abe_session=…; HttpOnly; Secure; SameSite=Lax`.
3. `GET /api/profile` → 200 with the Admin's record.
4. `PATCH /api/auth/password` to change the seeded password → 200, then log in again.
5. Forgot password for the Admin → 200 and a real email arrives. Reset with the link → 200.
6. `GET /api/employees` without a cookie → 401; as a Technician → 403.
7. Six wrong logins in a row → 429 with `Retry-After`.
8. A `POST` with the cookie but without the frontend `Origin` header → 403 `ORIGIN_NOT_ALLOWED`.

## 7. Before you hand over

- `INSTALL_ENABLED=false` and `INSTALL_SECRET` rotated.
- Seeded Admin password changed; real staff created through `POST /api/employees`; the seed account kept
  as a break-glass Admin or deactivated once a second Admin exists (the API never lets the last active
  Admin be removed).
- Nightly MySQL backups scheduled and one restore rehearsed into a separate database.
- The frontend built with the production API URL and `credentials: 'include'` on every request.
- Operators know the two emergency levers: rotate `AUTH_TOKEN_PEPPER` to log everyone out at once, and
  deactivate an employee (`PATCH /api/employees/:id` with `active: false`) to end one person's access immediately.

## 8. Later releases

```
npm ci --omit=dev
npm run build
npm run db:migrate:status      # shows pending migration files
# take a database backup here
npm run db:migrate
npm start
```

Migrations are forward-only and numbered in `backend/db/migrations`; never edit one that has been
applied, and never re-run `schema.sql` over an existing database.

## 9. Rollback

1. Stop the new release.
2. Restore the database backup taken before `db:migrate` (only needed if the release applied a migration).
3. Start the previous release.

Do not write "down" migrations by hand. Session cookies survive a rollback as long as the pepper is unchanged.
