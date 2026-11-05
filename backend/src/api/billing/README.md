# Billing

BE-040 is implemented: POST /api/orders/:order_id/invoice.
BE-041 (GET invoice) and BE-042 (cash payment) remain separate tasks.

## Issue invoice

Authenticate with the existing staff session cookie and send the trusted Origin header.
Only active Manager/Admin accounts may issue invoices. Send no body (even {} is rejected),
no query parameters, and a positive unsigned 32-bit order ID.

First issuance returns 201; repeat issuance returns 200 with the same invoice number,
issue timestamp and document facts. A completed order must have at least one line and every
line must be done. Other states return 409; a missing order returns 404. All errors use
centralized middleware. The issuing actor is taken exclusively from the verified session.

## Persistence and immutability

The existing normalized schema is authoritative. No JSON invoice_snapshot, duplicated totals,
new tables or migrations are needed. invoices stores historical garage/customer/vehicle facts.
Immutable service_versions and protected order_lines store line descriptions/prices; orders
stores immutable tax/currency/identity. Source rows are locked while first capturing identity.
The parent order is locked first to serialize issuance, edits and concurrent requests.
The unique invoices.order_id and invoice_number constraints provide additional protection.
Invoice creation and the invoice_issued audit event commit atomically using withTransaction.

Existing schema triggers prohibit invoice edits/deletes, order identity/tax/currency changes,
invoiced completion-state changes, invoiced line price/identity/progress changes, and service
version edits. Customer/garage/vehicle master data can still change without altering issued
invoice contact or vehicle fields. No payment or order-status mutation occurs when issuing.

The presenter calculates exact decimal totals using shared BigInt minor-unit helpers and the
stored order VAT rate, not the current garage rate. garage.vat_rate in this document is that
same agreed rate. paid, paid_at and paid_received_by come from cash_payments and remain live
metadata outside the immutable document facts. Internal notes, tracking hashes, passwords,
session data and issuer details are not exposed.

## Verification and manual use

Run node --test backend/tests/unit/invoice-issuance.test.js for service and exact-money checks.
In Git Bash, run DATABASE_INTEGRATION=true node --test backend/tests/integration/invoice-issuance.test.js
to require the MySQL/HTTP acceptance checks. They create a unique be040_test_<random> database,
apply the real schema/migrations, and remove that database afterward. The configured DB user
must have CREATE/DROP DATABASE privileges. Development records are not mutated. If MySQL
is unavailable, the default suite skips acceptance; DATABASE_INTEGRATION=true makes it fail.

Acceptance covers roles, inactive/expired/revoked sessions, CSRF, input validation, exact totals,
201/200, snapshot stability, concurrent requests, actual schema immutability, rollback, and live
payment metadata. Use fixtures while BE-037 technician completion remains unimplemented.

In Postman, log in as Manager/Admin, set invoice_order_id to an existing completed order, then
send Billing > Issue invoice. Repeat it to see 200 and the same document. Do not fabricate
completion in a shared database. The server returns printable JSON; PDF rendering is a client task.
