# Notifications (BE-043)

## Configuration

Use MAIL_ADAPTER=fake for local tests (messages stay in process memory) and smtp for delivery.
SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD and MAIL_FROM configure Nodemailer.
SMTP transport connection/greeting/socket timeouts are bounded at 5/5/10 seconds.
No generic email HTTP endpoint is provided.

All email links must use the HTTPS origin configured by FRONTEND_URL, never the request Host header.
Tracking paths are /order-status/:order_hash. PUBLIC_FRONTEND_URL is not used.
The default http://localhost:5173 is suitable for UI-only development, but email delivery will fail
safely and record email_failed until FRONTEND_URL is HTTPS. Do not just change localhost to HTTPS
unless an HTTPS frontend or proxy is running. Fake-mail tests can use https://garage.example.com;
that example does not host a working tracking page. CORS_ORIGIN remains the actual browser origin.
Use an actual hosted HTTPS frontend for usable customer links. Do not commit real .env files.

## Adapter contract

Import sendOrderCreatedEmail, sendCarReadyEmail, resendOrderEmail and sendPasswordResetEmail
from notification.service.js. Password reset keeps the existing inputs
{to, firstName, resetUrl, expiresInMinutes}; auth owns token generation and eligibility.
Only the password reset delivery receives the raw reset token in its URL.
Reset links must match the configured HTTPS frontend origin. Failure returns false so the auth
endpoint can preserve its generic response.

Order functions accept {to, customerName, orderHash, orderId, employeeId}; employeeId may be null.
Take these fields from stored records and verified actor context, never arbitrary request bodies.
Automatic sends return boolean SMTP acceptance, not inbox delivery. They record email_sent or
email_failed with the order/optional employee ID and database timestamp. No raw tokens, links,
addresses or message bodies go into history or warnings. History failure is warned separately and
does not reinterpret accepted mail as failure or resend it.

resendOrderEmail additionally accepts numeric status (4 selects car-ready; others tracking).
It resolves true on acceptance and throws a controlled AppError(503) with
{order_id, email_status: 'failed'} on delivery failure. BE-045 still owns its route, current customer
lookup, authentication/authorization and per-order/per-caller rate limits.

## Integration

createOrderService sends only after withTransaction resolves. Approval completing all work captures
recipient data within the transaction and sends only after commit. Repeated approval is rejected
before a second message. Automatic hook boundaries also catch unexpected adapter errors, preserving
the already committed order response. There is no durable outbox or exactly-once guarantee.

The existing order summary provides a Copy link fallback when tracking_url is available. Links use
the same HTTPS builder as email; malformed or HTTP link configuration produces null instead of
breaking order reads. SMTP acceptance is not proof that a message reached the inbox.

### Remaining cross-member dependency: BE-037

The technician job service is still a placeholder in this checkout. M2 must call sendCarReadyEmail
after its transaction commits, only when that transaction actually changes the parent order to 4.
Capture the stored recipient/hash and verified actor inside the transaction and return an internal
completion flag. Do not send for repeated done requests, unfinished lines, or a rolled-back mutation.
Do not implement a competing job-status workflow in this module. The adapter and failure tests are
ready for this integration. BE-043 cannot be called fully integrated until that path is implemented
and verified with M2.

## Verification

Run npm test --workspace backend for adapters, templates, URL validation and lifecycle tests.
order-notification-hooks.test.js uses Node registerHooks (Node 22.15+), replacing infrastructure
in its isolated test worker while exercising the real order service. It checks commit ordering,
rollback, repeated approval, unfinished/declined orders, and unexpected adapter failures.
Fake SMTP rejection/failure and history failures are covered without sending real email.
MySQL integration tests require an available local database; run DATABASE_INTEGRATION=true
npm test --workspace backend to require rather than skip the database checks in Git Bash.
Live SMTP/inbox acceptance and the unimplemented technician lifecycle are separate acceptance checks.
