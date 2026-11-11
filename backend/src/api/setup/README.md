# setup

Mounted at /api. No login required: these routes exist for operators and monitoring.

- BE-047 · `POST /api/install` · one-time install over HTTP: needs `INSTALL_ENABLED=true` and the `X-Setup-Key` header matching `INSTALL_SECRET`; creates tables, applies migrations, seeds roles/Admin/settings from `.env`, then locks itself (403 afterwards, 404 when disabled)
- BE-048 · `GET /api/health` · readiness: 200 when the database is initialised, 503 otherwise

Read [the team guide](../../../../docs/TEAM-GUIDE.md) for shared API contracts and routing. No function names or controller wrappers are mandatory.
