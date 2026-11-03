# Task BE-017: List and search customers

**Endpoint**: `GET /api/customers`

**Owner**: Member 2 · **Priority**: Must · **Requirement**: FR-CUS-03

**Dependencies**: BE-003. Dependencies describe contracts and integration order; use fixtures to begin development before the corresponding endpoint is complete.

## 1. API Documentation

- **Method**: `GET`
- **URL**: `/api/customers`
- **Access**: Any active staff
- **Authentication**: session cookie set by `POST /api/auth/login` (see [AUTH-DESIGN.md](../AUTH-DESIGN.md))
- **Content-Type**: `application/json`

### Request body

None. Do not send a JSON body.

### Query parameters example

```json
{
  "search": "sar",
  "active": true,
  "page": 1,
  "limit": 10
}
```

See [shared conventions](../CONVENTIONS.md) for types, limits and defaults. All filters are optional. Endpoint-specific behavior is described below.

### Success response (200)

```json
{
  "status": "success",
  "message": "List and search customers successful",
  "data": {
    "customers": [
      {
        "customer_id": 12,
        "first_name": "Sara",
        "last_name": "Tesfaye",
        "email": "sara@example.com",
        "phone": "0912345678",
        "active": true,
        "created_at": "2026-10-25T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

Examples use representative fixture records. Responses may have more/fewer array elements; fields and types are contractual. Nullable fields remain present as null. Where a task documents a restricted role projection, that projection replaces the general example for that role.

### Errors

- 400 Invalid input (unless this task specifies a different public-token rule)
- 401 Missing, invalid or expired session cookie
- 403 Inactive account or insufficient role
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
2. Add `listCustomersValidation` in `backend/src/api/customers/validations/customer.validation.js`.
3. Implement `listCustomersController` in `backend/src/api/customers/controller/customer.controller.js`. Extract allowlisted inputs and verified actor context only.
4. Implement `listCustomersService` in `backend/src/api/customers/service/customer.service.js`. Keep business rules and SQL out of controllers.
5. Share transactions, money/status helpers and notification adapter as described in foundation tasks; do not duplicate other modules’ logic.
6. On errors call `next(error)` from controller catches or use the shared async wrapper. Do not send competing error formats.

## 3. Logic & Git Instructions

### Logic steps

1. Filter by search across first_name,last_name,email,phone and optional active. Use common pagination and stable newest-first ordering.
2. Accept search of any nonempty length up to 100; the frontend starts searching after 3 characters. Use placeholders for every supplied value.

### Git workflow

```bash
git checkout dev
git pull --ff-only origin dev
git checkout -b codex/be-017-list-customers
# Implement and run task-specific checks
git add <changed-files>
git commit -m "[BE-017] List and search customers"
git push -u origin codex/be-017-list-customers
```

Open a PR into dev with requirement IDs, examples and test evidence. One teammate reviews. Coordinate shared route registration through Member 1; module files belong to their listed owner.

### PR checklist and acceptance criteria

- [ ] Successful request returns 200 and exactly the documented safe response shape.
- [ ] Missing/expired session cookie returns401; inactive account and unauthorized role return403.
- [ ] Invalid/unknown input fields are rejected; no unexpected database changes occur on failure.
- [ ] GET has no data-changing side effects; list pagination/counts stay consistent.
- [ ] All errors go through centralized error middleware; no sensitive fields or stack traces escape.

## 4. Logic Diagram

```mermaid
flowchart TD
    A["GET /api/customers"] --> B["Verify token, current account and role"]
    B --> C["Validate allowed input"]
    C --> D["Read records and apply safe projection"]
    D --> E["Return 200 documented response"]
    B -. Failure .-> F["Centralized error middleware"]
    C -. Failure .-> F
    D -. Failure .-> F
```
