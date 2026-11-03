# Task BE-015: Update garage settings

**Endpoint**: `PATCH /api/settings`

**Owner**: Member 1 · **Priority**: Must (supporting endpoint) · **Requirement**: Settings / FR-INV-05

**Dependencies**: BE-014. Dependencies describe contracts and integration order; use fixtures to begin development before the corresponding endpoint is complete.

## 1. API Documentation

- **Method**: `PATCH`
- **URL**: `/api/settings`
- **Access**: Admin
- **Authentication**: session cookie set by `POST /api/auth/login` (see [AUTH-DESIGN.md](../AUTH-DESIGN.md))
- **Content-Type**: `application/json`

### Request body

```json
{
  "name": "Abe Garage",
  "phone": "0111234567",
  "vat_rate": "15.00"
}
```

### Success response (200)

```json
{
  "status": "success",
  "message": "Update garage settings successful",
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
2. Add `updateSettingsValidation` in `backend/src/api/settings/validations/settings.validation.js`.
3. Implement `updateSettingsController` in `backend/src/api/settings/controller/settings.controller.js`. Extract allowlisted inputs and verified actor context only.
4. Implement `updateSettingsService` in `backend/src/api/settings/service/settings.service.js`. Keep business rules and SQL out of controllers.
5. Share transactions, money/status helpers and notification adapter as described in foundation tasks; do not duplicate other modules’ logic.
6. On errors call `next(error)` from controller catches or use the shared async wrapper. Do not send competing error formats.

## 3. Logic & Git Instructions

### Logic steps

1. Allow name,address,phone,email,vat_rate; reject unknown fields/empty updates. Validate contact data and decimal rate from 0 to 100.
2. The agreed launch VAT is 15%. Changes affect newly created orders only; existing orders use their stored vat_rate. Never recalculate old orders or invoices from current settings.
3. Issued invoices retain their stored snapshot even if garage contact information changes.

### Git workflow

```bash
git checkout dev
git pull --ff-only origin dev
git checkout -b codex/be-015-update-settings
# Implement and run task-specific checks
git add <changed-files>
git commit -m "[BE-015] Update garage settings"
git push -u origin codex/be-015-update-settings
```

Open a PR into dev with requirement IDs, examples and test evidence. One teammate reviews. Coordinate shared route registration through Member 1; module files belong to their listed owner.

### PR checklist and acceptance criteria

- [ ] Successful request returns 200 and exactly the documented safe response shape.
- [ ] Missing/expired session cookie returns401; inactive account and unauthorized role return403.
- [ ] Invalid/unknown input fields are rejected; no unexpected database changes occur on failure.
- [ ] Transaction/concurrency behavior and repeated-request behavior match the logic below.
- [ ] All errors go through centralized error middleware; no sensitive fields or stack traces escape.

## 4. Logic Diagram

```mermaid
flowchart TD
    A["PATCH /api/settings"] --> B["Verify token, current account and role"]
    B --> C["Validate allowed input"]
    C --> D["Check business rules and perform atomic changes"]
    D --> E["Return 200 documented response"]
    B -. Failure .-> F["Centralized error middleware"]
    C -. Failure .-> F
    D -. Failure .-> F
```
