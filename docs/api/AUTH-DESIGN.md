# Authentication design (BE-01)

This is the agreed, implemented design for staff authentication. It replaces every mention of
JWT, `Authorization: Bearer` and `token_version` elsewhere in these docs.

## In one paragraph

When a staff member logs in, the server creates a random session token, stores only its SHA-256
hash in the `sessions` table and sends the token to the browser in an httpOnly cookie. The
browser sends the cookie back automatically. On every protected request the server checks the
cookie signature, looks the session up in MySQL together with the employee, and refuses if the
session is missing, expired, or the employee is deactivated. Logging out deletes the row.
Changing a password, a role or the active flag deletes all of the employee's rows, which logs
them out everywhere at once.

## Cookie

| Setting  | Value                                                            |
| -------- | ---------------------------------------------------------------- |
| Name     | `abe_session` in development, `__Host-abe_session` in production |
| Value    | `<token>.<hmac-sha256(token, AUTH_TOKEN_PEPPER)>`                |
| httpOnly | yes (JavaScript cannot read it)                                  |
| Secure   | yes in production                                                |
| SameSite | Lax                                                              |
| Path     | `/`                                                              |
| Expires  | the session's `expires_at`                                       |

The signature lets the server reject forged cookies before touching the database. The database
holds only the hash of the token, so a leaked database dump cannot be turned into valid cookies.

## Session lifetime

- Idle lifetime: `SESSION_TTL_HOURS` (default 12). A request made within
  `SESSION_UPDATE_AGE_HOURS` (default 2) of expiry extends the session by the full lifetime and
  re-sends the cookie.
- Absolute lifetime: `SESSION_ABSOLUTE_HOURS` (default 168). A session older than this is refused
  no matter how recently it was used.
- At most `SESSION_MAX_PER_EMPLOYEE` (default 10) live sessions per employee; the oldest are
  removed when the limit is exceeded.
- Expired rows are purged on start-up and hourly, and with `npm run db:purge-auth`.

## Request pipeline for a protected route

```
cookieParser -> requireTrustedOrigin -> authenticate -> hasRole(...) -> validation -> controller
                                                                                    \-> errorHandler
```

| Middleware             | File                               | What it does                                                                                                                                                                |
| ---------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requireTrustedOrigin` | `src/middleware/csrf.js`           | For POST/PATCH/DELETE with a session cookie: `Origin` must equal `FRONTEND_URL` and `Sec-Fetch-Site` must not be `cross-site`. Requests without a cookie are skipped.       |
| `authenticate`         | `src/middleware/authentication.js` | Reads the cookie, verifies the signature, loads session + employee, sets `req.user = { employee_id, role_id, session_id }`. 401 when missing/expired, 403 when deactivated. |
| `hasRole(...ids)`      | `src/middleware/authorization.js`  | 403 unless `req.user.role_id` is in the list. Roles are fixed: 1 Technician, 2 Manager, 3 Admin.                                                                            |
| validation chains      | `src/api/<module>/validations/`    | express-validator plus `rejectUnknownBodyFields`, `requireAtLeastOneBodyField` from `src/middleware/validators.js`.                                                         |
| rate limits            | `src/middleware/rate-limits.js`    | Counters in `auth_rate_limits`, per IP and per email, every attempt counts. 429 with `Retry-After`.                                                                         |
| `errorHandler`         | `src/middleware/error-handler.js`  | Turns thrown errors into `{ status, message, data, code }`.                                                                                                                 |

## Error envelope

```json
{
  "status": "error",
  "message": "Invalid email or password",
  "data": null,
  "code": "INVALID_CREDENTIALS"
}
```

`code` is new and additive. Codes are listed in `src/constants/error-codes.js`. Typed error
classes (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`,
`ConflictError`, `RateLimitError`, `ServiceUnavailableError`) live in `src/utils/errors/index.js`.

## Passwords

Node's built-in scrypt (`N=16384, r=16, p=1`, random 16-byte salt), stored as
`scrypt$N$r$p$salt$hash`. 8 to 128 characters, never trimmed. Unknown emails are compared against
a dummy hash so login timing does not reveal whether an account exists.

## Password reset

1. `POST /api/auth/forgot-password` always answers 200 with the same message.
2. For an active employee it stores the SHA-256 of a new random token with a 15-minute expiry,
   marks older tokens used, and after commit emails `FRONTEND_URL/reset-password?token=<raw>`.
3. `POST /api/auth/reset-password` hashes the token, locks the employee then the token row,
   rechecks everything, updates the password, marks all tokens used and deletes all sessions.
   Missing, used, expired tokens and inactive employees all answer 400 `INVALID_RESET_LINK`.
4. The user is not logged in afterwards.

Email goes through `src/shared/notifications/notification.service.js`. `MAIL_ADAPTER=fake` keeps
messages in memory for development and tests; production requires `MAIL_ADAPTER=smtp`.

## Database (migration 002)

| Table              | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| `sessions`         | one row per live login; `token_hash` is unique          |
| `auth_rate_limits` | hit counters per hashed key and time window             |
| `app_setup`        | single row written when `POST /api/install` completes   |
| `auth_events`      | audit trail: logins, failures, logouts, resets, changes |

`employees.token_version` was dropped. Revocation is `DELETE FROM sessions WHERE employee_id = ?`.

Lock order for transactions that touch these tables: `employees` row, then
`password_reset_tokens`, then `sessions`.

## Environment variables

See `backend/.env.example`: `AUTH_TOKEN_PEPPER`, `SESSION_COOKIE_NAME`, `SESSION_TTL_HOURS`,
`SESSION_UPDATE_AGE_HOURS`, `SESSION_ABSOLUTE_HOURS`, `SESSION_MAX_PER_EMPLOYEE`, `TRUST_PROXY`,
`MAIL_ADAPTER`. The `JWT_*` variables no longer exist.

## Frontend requirements

- Call the API with `credentials: "include"` (fetch) or `withCredentials: true` (axios).
- Store nothing about authentication in `localStorage`; call `GET /api/profile` to find out who is
  logged in.
- Send requests from the exact `FRONTEND_URL` origin; the server rejects data-changing requests
  from any other origin.

## Testing with Postman or curl

Postman keeps cookies automatically: call `POST /api/auth/login` once, then the other requests.
For data-changing requests add the header `Origin: http://localhost:5173` (your `FRONTEND_URL`).
With curl use `-c cookies.txt -b cookies.txt` and `-H "Origin: http://localhost:5173"`.
