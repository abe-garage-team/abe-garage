# Task BE-019: Edit or deactivate customer

**Endpoint**: `PATCH /api/customers/:customer_id`

**Owner**: Member 2 · **Priority**: Must · **Requirement**: FR-CUS-04 / NFR-07

**Dependencies**: BE-016. Dependencies describe contracts and integration order; use fixtures to begin development before the corresponding endpoint is complete.

## 1. API Documentation

- **Method**: `PATCH`
- **URL**: `/api/customers/:customer_id`
- **Access**: Manager or Admin
- **Authentication**: session cookie set by `POST /api/auth/login` (see [AUTH-DESIGN.md](../AUTH-DESIGN.md))
- **Content-Type**: `application/json`
- **Path parameters**: `customer_id` (positive integer)

### Request body

```json
{
  "phone": "0912000000",
  "active": true
}
```

### Success response (200)

```json
{
  "status": "success",
  "message": "Edit or deactivate customer successful",
  "data": {
    "customer_id": 12,
    "first_name": "Sara",
    "last_name": "Tesfaye",
    "email": "sara@example.com",
    "phone": "0912000000",
    "active": true,
    "created_at": "2026-10-25T12:00:00Z"
  }
}
```

Examples use representative fixture records. Responses may have more/fewer array elements; fields and types are contractual. Nullable fields remain present as null. Where a task documents a restricted role projection, that projection replaces the general example for that role.

### Errors

- 400 Invalid input (unless this task specifies a different public-token rule)
- 401 Missing, invalid or expired session cookie
- 403 Inactive account or insufficient role
- 404 Customer not found
- 409 Customer email or phone already used
- 500 Unexpected server error

Shared error format (field errors apply to validation failures):

```json
{
  "status": "error",
  "message": "Validation failed",
  "data": {
    "errors": {
      "email": "Enter a valid email address"
    }
  }
}
```

Non-validation errors use `data: null`, except explicitly documented safe metadata. See [shared conventions](../CONVENTIONS.md).

## 2. Instructions

1. Define route and middleware in `backend/src/api/customers/routes/customer.route.js`.
2. Add `updateCustomerValidation` in `backend/src/api/customers/validations/customer.validation.js`.
3. Implement `updateCustomerController` in `backend/src/api/customers/controller/customer.controller.js`. Extract allowlisted inputs and verified actor context only.
4. Implement `updateCustomerService` in `backend/src/api/customers/service/customer.service.js`. Keep business rules and SQL out of controllers.
5. Share transactions, money/status helpers and notification adapter as described in foundation tasks; do not duplicate other modules’ logic.
6. On errors call `next(error)` from controller catches or use the shared async wrapper. Do not send competing error formats.

## 3. Logic & Git Instructions

### Logic steps

1. Allow first_name,last_name,email,phone,active only; reject unknown fields/empty updates.
2. Enforce normalized unique email/phone. Retain record and historical orders when deactivated; no DELETE endpoint.
3. Inactive customers cannot be selected for new orders; their existing work can still be finished. Issued invoice snapshots are unaffected by profile edits.

### Git workflow

```bash
git checkout dev
git pull --ff-only origin dev
git checkout -b codex/be-019-update-customer
# Implement and run task-specific checks
git add <changed-files>
git commit -m "[BE-019] Edit or deactivate customer"
git push -u origin codex/be-019-update-customer
```

Open a PR into dev with requirement IDs, examples and test evidence. One teammate reviews. Coordinate shared route registration through Member 1; module files belong to their listed owner.

### PR checklist and acceptance criteria

- [ ] Successful request returns 200 and exactly the documented safe response shape.
- [ ] Missing/expired session cookie returns401; inactive account and unauthorized role return403.
- [ ] Verify 404 Customer not found.
- [ ] Verify 409 Customer email or phone already used.
- [ ] Invalid/unknown input fields are rejected; no unexpected database changes occur on failure.
- [ ] Transaction/concurrency behavior and repeated-request behavior match the logic below.
- [ ] All errors go through centralized error middleware; no sensitive fields or stack traces escape.

## 4. Logic Diagram

```mermaid
flowchart TD
    A["PATCH /api/customers/:customer_id"] --> B["Verify token, current account and role"]
    B --> C["Validate allowed input"]
    C --> D["Check business rules and perform atomic changes"]
    D --> E["Return 200 documented response"]
    B -. Failure .-> F["Centralized error middleware"]
    C -. Failure .-> F
    D -. Failure .-> F
```
