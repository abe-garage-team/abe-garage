# Deployment checklist (BE-050)

## 1. Environment

Copy `backend/.env.example` to the host's secret store and set:

- `NODE_ENV=production`
- `DB_*` for a persistent MySQL 8 database that only the backend can reach.
- `AUTH_TOKEN_PEPPER`: at least 32 random characters. Rotating it logs every employee out.
- `SESSION_*`: defaults are 12h idle, 2h refresh window, 168h absolute, 10 sessions per employee.
- `TRUST_PROXY`: number of reverse proxies in front of the API (for example `1` behind one load balancer). Wrong values break IP rate limiting.
- `FRONTEND_URL` and `CORS_ORIGIN`: the exact HTTPS origin of the deployed frontend. The origin check and CORS use these.
- `MAIL_ADAPTER=smtp` plus `SMTP_*` and `MAIL_FROM`. The server refuses to start in production with the fake adapter. Confirm outbound SMTP is allowed from the host.
- `INITIAL_ADMIN_*` and `GARAGE_*` for the first seed.
- `INSTALL_ENABLED` / `INSTALL_SECRET` only while installing (see below).

HTTPS is required in production: the session cookie is named `__Host-abe_session`, which browsers only accept over HTTPS.

## 2. Database

Preferred: run the CLI.

```
mysql -u <user> -p <empty_database> < backend/db/schema.sql
npm run db:migrate
npm run seed:admin
```

Alternative: set `INSTALL_ENABLED=true` and `INSTALL_SECRET`, start the API, then

```
curl -X POST https://api.example.com/api/install -H "X-Setup-Key: <INSTALL_SECRET>"
```

`/api/install` creates the tables when the database is empty, applies migrations, seeds roles/Admin/settings and writes `app_setup`, after which it answers 403 forever. Then set `INSTALL_ENABLED=false` and rotate `INSTALL_SECRET`.

Later releases: `npm run db:migrate:status`, then `npm run db:migrate`. Never edit an applied migration. Rollback means restoring the previous backup; migrations are forward-only.

## 3. Run

```
npm ci --omit=dev
npm run build            # frontend/dist, deploy with SPA fallback
npm start                # backend/index.js
```

Use a process manager (systemd, pm2) that restarts on exit. Readiness: `GET /api/health` returns 200 `{ ready: true }` only when the database is reachable and seeded. Logs are one JSON line per event on stdout; they never contain bodies, cookies or passwords.

## 4. After deployment

- Log in as the seeded Admin, change the password (`PATCH /api/auth/password`), and create the real staff accounts.
- Schedule nightly MySQL backups and rehearse one restore into a separate database.
- `npm run db:purge-auth` is optional; the API purges expired auth rows hourly on its own.
- Run the Postman collection against the deployed API with synthetic records: login, profile, change password, forgot/reset, employees CRUD, settings, 401/403 and 429 cases.

## 5. Rollback

Stop the new release, restore the database backup taken before `db:migrate`, start the previous release. Do not run destructive down-migrations by hand.
