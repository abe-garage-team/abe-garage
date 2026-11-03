# Shared backend API conventions

This contract applies to every endpoint and task. Node.js/Express and MySQL form one modular backend. API base is /api with no version segment. No public registration, Google sign-in, /me, online payment, appointment booking or inventory endpoints.

## Requests and responses

- snake_case JSON names; plural resource URLs; Content-Type:application/json. GET requests have no body. PATCH is partial update, never an unrestricted database merge.
- Successful envelope: {status:"success",message,data}. Error envelope: {status:"error",message,data:null,code}; validation uses data.errors keyed by field; code is a stable string from backend/src/constants/error-codes.js. HTTP statuses remain authoritative.
- Missing required data/invalid type/empty PATCH/unknown body or query field →400. Duplicate unique data or invalid state →409; missing resource →404. Wrong method on unknown API route →404 through shared not-found handler.
- Public tracking malformed/unknown hash intentionally returns404; reset invalid/used/expired token intentionally returns400. Never leak underlying token existence.
- IDs are positive safe JSON integers; SQL BIGINT must remain within Number.MAX_SAFE_INTEGER or be serialized consistently as strings after an explicit contract change. FK types must exactly match referenced PK types.
- Database booleans serialize to JSON true/false. Money and labor_hours serialize as decimal strings with two places. Keep MySQL DECIMAL strings; never parseFloat for arithmetic.
- Time values are ISO8601 UTC with Z; store UTC DATETIME. Configure DB/session timezone UTC. Null timestamps remain null. Local day/week/month boundaries use GARAGE_TIMEZONE=Africa/Addis_Ababa.
- Illustrative launch currency is ETB; team must confirm before release. Use one CURRENCY_CODE env value consistently; no FX or multicurrency. Currency is snapshotted with orders/invoices.
- Names: nonempty 1–100 chars; email max254 normalized lowercase; phone max32 normalized with one shared policy while preserving string format; notes max2000; plate max32 uppercase; other vehicle strings max100; year1886..current year+1. Validate strict numbers, not coercible mixtures.
- Password policy: 8 to 128 characters, hashed with Node's built-in scrypt; never trim passwords. Existing passwords can be checked on login without reapplying new-password rules.
- Positive page defaults1; limit defaults10, max100. Invalid/zero/negative/noninteger values →400, no silent clamping. total_pages=ceil(total/limit),0 if no results. Empty/beyond-last page →200 empty array.
- search is trimmed text max100. Query active/paid/unpaid_only accept only strings true or false, not truthiness. status1..5, role_id1..3, line_status0..2; customer_id/vehicle_id positive integers. Unspecified filters mean all allowed records.
- Examples show optional filters, not mandatory combinations. No unlisted client-controlled sort fields. Stable sort defined per endpoint.

## Authentication and errors

- Server-side sessions in an httpOnly, SameSite=Lax cookie (see [AUTH-DESIGN.md](AUTH-DESIGN.md)). The cookie value is signed; the database stores only the token hash. On every protected request read the session and the employee's current role/active flag from MySQL.
- Missing, invalid or expired session →401. Deleted/unavailable employee →401. Inactive employee →403. Current role disallowed →403. Cookies or frontend cache never grant authority alone.
- Deactivation/reactivation/role changes and password reset/change delete every session of that employee (logged out everywhere). Email changes invalidate outstanding reset links; current role always comes from DB. Logout deletes the current session row and clears the cookie.
- Central AppError(message,statusCode,details) and typed subclasses. Controllers catch and next(error); shared async wrapper is permitted. Error middleware (err,req,res,next) comes after all routes and not-found handler.
- Map validation400,auth401,forbidden403,missing404,duplicate/state409,rate limit429,unexpected500,external mail outage503. Unknown errors return generic message, with sanitized server-side logs and no SQL/stack/secret to client.
- Malformed JSON and body-size limit errors use same envelope (400/413). Include Retry-After on429. Parameterized SQL for every untrusted value; dynamic columns/sort/clauses from static allowlists only.
- Bound JSON bodies to256KB by default. Configure allowed frontend origin,HTTPS,request IDs and login/reset/public lookup/resend rate limits (stored in auth_rate_limits). Data-changing requests carrying a session cookie must send the frontend Origin header. Redact cookies,passwords,reset tokens and public tracking hashes from logs.

## Money and order lifecycle

- Service/order-line prices are before VAT. Compute in integer minor units or tested decimal utility: subtotal=sum(lines); VAT=round half up(subtotal*vat_rate/100) once; total=subtotal+VAT. Do not round VAT per line.
- At creation snapshot VAT rate,currency and line name/description/labor_hours/price. Subsequent catalogue/settings updates never change those values. Helpers are shared across orders,estimates,invoices and dashboard.
- Status1 Awaiting approval;2 Approved;3 In progress;4 Completed;5 Declined. Paid is a separate boolean.
- Initial1→2 or5 via recorded approval;2→3 on first start;3→4 when all jobs done. Job0→1→2 only. No job progress without approved scope. Approval actor/time/method and every significant mutation go in history.
- Extra work Should feature: statuses1/2/3 may add an unstarted line; approved scope goes back to1 and all progress pauses until new approval. Preserve old progress/history and derive2/3/4 after reapproval. Declining with performed work is deliberately unsupported409; never wipe performed work.
- Every mutation affecting order/lines/invoice/payment locks the parent order first on one connection. This serializes status,totals,approval,assignments and invoice issuance. Lock lines only after parent. Missing line checks must be revalidated after locking.
- All multi-row writes use begin/commit/rollback with connection release in finally. External email runs after commit and cannot undo successful creation/completion.
- One active Technician per line. Manager/Admin may assign/progress work, but candidate assigned employee must have Technician role.
- No DELETE endpoints for employee/customer/vehicle/service/order records. Customer/staff/service use active flag; vehicle ownership transfer and order cancellation beyond initial decline are out of scope. Unapproved,unstarted estimate-line replacement may remove child lines only with history.

## Printing, website and external side effects

- Estimates and invoices return JSON; frontend uses A4 print CSS/browser Save as PDF. GET does not issue an invoice; POST issues it once. No PDF binary generation service.
- Public Home/About/Contact are frontend content; service list and tracking are the backend APIs they need. Contact form delivery is not required; no invented contact-submission endpoint.
- Email sent means SMTP accepted the message, not guaranteed inbox delivery. Automatic send failures write history and keep order success; explicit resend may return503. No exactly-once SMTP guarantee; production crash retries may require a future durable outbox.
- Automatic creation and completion hooks belong to shared notifications service, not frontend calls or internal HTTP calls. Use an injected fake mail adapter while integration is incomplete.

## Verified technical references

- Express error handling: https://expressjs.com/en/4x/guide/error-handling/
- OWASP password reset: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html

The attachment supplies the task-document structure, not additional garage requirements. Agreed garage requirements and subsequent conversation decisions control behavior.

See [request field rules and response variants](VALIDATION.md) for required/optional/null fields,role projections and alternate success states. Order history may include details JSON for safe audit metadata.
