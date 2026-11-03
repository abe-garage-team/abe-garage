# Task BE-014: Read garage settings

**Endpoint**: `GET /api/settings`

**Owner**: Member 1 · **Priority**: Must (supporting endpoint) · **Requirement**: Settings / FR-INV-01

**Dependencies**: BE-003. Dependencies describe contracts and integration order; use fixtures to begin development before the corresponding endpoint is complete.

## 1. API Documentation

- **Method**: `GET`
- **URL**: `/api/settings`
- **Access**: Admin
- **Authentication**: session cookie set by `POST /api/auth/login` (see [AUTH-DESIGN.md](../AUTH-DESIGN.md))
- **Content-Type**: `application/json`

### Request body

None. Do not send a JSON body.

### Success response (200)

```json
{
  "status": "success",
  "message": "Read garage settings successful",
  "data": {
    "settings_id": 1,
    "name": "Abe Garage",
    "address": "Addis Ababa",
    "phone": "0111234567",
    "email": "contact@abegarage.com",
    "vat_rate": "15.00"
  }
}
```

Examples use representative fixture records. Responses may have more/fewer array elements; fields and types are contractual. Nullable fields remain present as null. Where a task documents a restricted role projection, that projection replaces the general example for that role.

### Errors

- 400 Invalid input (unless this task specifies a different public-token rule)
- 401 Missing, invalid or expired session cookie
- 403 Inactive account or insufficient role
- 503 System not initialized
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

1. Define route and middleware in `backend/src/api/settings/routes/settings.route.js`.
2. Add `getSettingsValidation` in `backend/src/api/settings/validations/settings.validation.js`.
3. Implement `getSettingsController` in `backend/src/api/settings/controller/settings.controller.js`. Extract allowlisted inputs and verified actor context only.
4. Implement `getSettingsService` in `backend/src/api/settings/service/settings.service.js`. Keep business rules and SQL out of controllers.
5. Share transactions, money/status helpers and notification adapter as described in foundation tasks; do not duplicate other modules’ logic.
6. On errors call `next(error)` from controller catches or use the shared async wrapper. Do not send competing error formats.

## 3. Logic & Git Instructions

### Logic steps

1. Read singleton settings_id=1. Return 503 if installation has not completed. Do not expose SMTP credentials or environment secrets.

### Git workflow

```bash
git checkout dev
git pull --ff-only origin dev
git checkout -b codex/be-014-get-settings
# Implement and run task-specific checks
git add <changed-files>
git commit -m "[BE-014] Read garage settings"
git push -u origin codex/be-014-get-settings
```

Open a PR into dev with requirement IDs, examples and test evidence. One teammate reviews. Coordinate shared route registration through Member 1; module files belong to their listed owner.

### PR checklist and acceptance criteria

- [ ] Successful request returns 200 and exactly the documented safe response shape.
- [ ] Missing/expired session cookie returns401; inactive account and unauthorized role return403.
- [ ] Verify 503 System not initialized.
- [ ] Invalid/unknown input fields are rejected; no unexpected database changes occur on failure.
- [ ] GET has no data-changing side effects; list pagination/counts stay consistent.
- [ ] All errors go through centralized error middleware; no sensitive fields or stack traces escape.

## 4. Logic Diagram

```mermaid
flowchart TD
    A["GET /api/settings"] --> B["Verify token, current account and role"]
    B --> C["Validate allowed input"]
    C --> D["Read records and apply safe projection"]
    D --> E["Return 200 documented response"]
    B -. Failure .-> F["Centralized error middleware"]
    C -. Failure .-> F
    D -. Failure .-> F
```
