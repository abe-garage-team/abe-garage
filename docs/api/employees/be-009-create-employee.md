# Task BE-009: Create employee

**Endpoint**: `POST /api/employees`

**Owner**: Member 1 · **Priority**: Must · **Requirement**: FR-EMP-01/02

**Dependencies**: BE-003. Dependencies describe contracts and integration order; use fixtures to begin development before the corresponding endpoint is complete.

## 1. API Documentation

- **Method**: `POST`
- **URL**: `/api/employees`
- **Access**: Admin
- **Authentication**: session cookie set by `POST /api/auth/login` (see [AUTH-DESIGN.md](../AUTH-DESIGN.md))
- **Content-Type**: `application/json`

### Request body

```json
{
  "first_name": "Abebe",
  "last_name": "Kebede",
  "email": "abebe@abegarage.com",
  "phone": "0911234567",
  "password": "StrongPassword123!",
  "role_id": 1,
  "active": true
}
```

### Success response (201)

```json
{
  "status": "success",
  "message": "Create employee successful",
  "data": {
    "employee_id": 5,
    "first_name": "Abebe",
    "last_name": "Kebede",
    "email": "abebe@abegarage.com",
    "phone": "0911234567",
    "role_id": 1,
    "role_name": "Technician",
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
- 409 Email already used
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

1. Define route and middleware in `backend/src/api/employees/routes/employee.route.js`.
2. Add `createEmployeeValidation` in `backend/src/api/employees/validations/employee.validation.js`.
3. Implement `createEmployeeController` in `backend/src/api/employees/controller/employee.controller.js`. Extract allowlisted inputs and verified actor context only.
4. Implement `createEmployeeService` in `backend/src/api/employees/service/employee.service.js`. Keep business rules and SQL out of controllers.
5. Share transactions, money/status helpers and notification adapter as described in foundation tasks; do not duplicate other modules’ logic.
6. On errors call `next(error)` from controller catches or use the shared async wrapper. Do not send competing error formats.

## 3. Logic & Git Instructions

### Logic steps

1. Validate nonempty names (1–100 characters), normalized unique email, phone string, password policy, role_id in 1/2/3, and boolean active (default true).
2. Hash password; insert employee with token_version=0. Database UNIQUE(email) is the final concurrency safeguard; map duplicate to 409.
3. Return safe created employee; never accept employee_id, token_version, password_hash or created_at from client.

### Git workflow

```bash
git checkout dev
git pull --ff-only origin dev
git checkout -b codex/be-009-create-employee
# Implement and run task-specific checks
git add <changed-files>
git commit -m "[BE-009] Create employee"
git push -u origin codex/be-009-create-employee
```

Open a PR into dev with requirement IDs, examples and test evidence. One teammate reviews. Coordinate shared route registration through Member 1; module files belong to their listed owner.

### PR checklist and acceptance criteria

- [ ] Successful request returns 201 and exactly the documented safe response shape.
- [ ] Missing/expired session cookie returns401; inactive account and unauthorized role return403.
- [ ] Verify 409 Email already used.
- [ ] Invalid/unknown input fields are rejected; no unexpected database changes occur on failure.
- [ ] Transaction/concurrency behavior and repeated-request behavior match the logic below.
- [ ] All errors go through centralized error middleware; no sensitive fields or stack traces escape.

## 4. Logic Diagram

```mermaid
flowchart TD
    A["POST /api/employees"] --> B["Verify token, current account and role"]
    B --> C["Validate allowed input"]
    C --> D["Check business rules and perform atomic changes"]
    D --> E["Return 201 documented response"]
    B -. Failure .-> F["Centralized error middleware"]
    C -. Failure .-> F
    D -. Failure .-> F
```
