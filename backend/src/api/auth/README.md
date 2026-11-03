# auth

Routes are mounted at /api/auth.

- BE-004 · `POST /api/auth/login` · sets the session cookie
- BE-004b · `POST /api/auth/logout` · deletes the session and clears the cookie

Files: `routes/auth.route.js` (middleware order), `validations/auth.validation.js`, `controller/auth.controller.js`, `service/auth.service.js` (all business rules and SQL). Design: [docs/api/AUTH-DESIGN.md](../../../../docs/api/AUTH-DESIGN.md).
