# Task BE-024: View vehicle service history

**Endpoint**: `GET /api/vehicles/:vehicle_id/orders`

**Owner**: Member 2 · **Priority**: Should · **Requirement**: FR-VEH-04

**Dependencies**: BE-022. Dependencies describe contracts and integration order; use fixtures to begin development before the corresponding endpoint is complete.

## 1. API Documentation

- **Method**: `GET`
- **URL**: `/api/vehicles/:vehicle_id/orders`
- **Access**: Any active staff
- **Authentication**: session cookie set by `POST /api/auth/login` (see [AUTH-DESIGN.md](../AUTH-DESIGN.md))
- **Content-Type**: `application/json`
- **Path parameters**: `vehicle_id` (positive integer)

### Request body

None. Do not send a JSON body.

### Query parameters example

```json
{
  "page": 1,
  "limit": 10
}
```

See [shared conventions](../CONVENTIONS.md) for types, limits and defaults. All filters are optional. Endpoint-specific behavior is described below.

### Success response (200)

```json
{
  "status": "success",
  "message": "View vehicle service history successful",
  "data": {
    "orders": [
      {
        "order_id": 24,
        "customer_id": 12,
        "customer_name": "Sara Tesfaye",
        "vehicle_id": 8,
        "plate": "AA-12345",
        "status": 1,
        "status_name": "Awaiting approval",
        "subtotal": "230.00",
        "vat_rate": "15.00",
        "vat_amount": "34.50",
        "total": "264.50",
        "currency": "ETB",
        "paid": false,
        "created_at": "2026-10-25T12:00:00Z",
        "estimated_ready_date": "2026-10-27T09:00:00Z",
        "completed_at": null,
        "jobs": [
          {
            "service_name": "Oil change",
            "line_price": "50.00"
          },
          {
            "service_name": "Brake service",
            "line_price": "180.00"
          }
        ]
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
- 404 Vehicle not found
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

1. Define route and middleware in `backend/src/api/vehicles/routes/vehicle.route.js`.
2. Add `vehicleHistoryValidation` in `backend/src/api/vehicles/validations/vehicle.validation.js`.
3. Implement `vehicleHistoryController` in `backend/src/api/vehicles/controller/vehicle.controller.js`. Extract allowlisted inputs and verified actor context only.
4. Implement `vehicleHistoryService` in `backend/src/api/vehicles/service/vehicle.service.js`. Keep business rules and SQL out of controllers.
5. Share transactions, money/status helpers and notification adapter as described in foundation tasks; do not duplicate other modules’ logic.
6. On errors call `next(error)` from controller catches or use the shared async wrapper. Do not send competing error formats.

## 3. Logic & Git Instructions

### Logic steps

1. Verify vehicle exists; return paginated order history including date,status,jobs,total and paid flag for this vehicle only.
2. Use stored line snapshots and prices, not current catalogue prices. Order newest first.

### Git workflow

```bash
git checkout dev
git pull --ff-only origin dev
git checkout -b codex/be-024-vehicle-history
# Implement and run task-specific checks
git add <changed-files>
git commit -m "[BE-024] View vehicle service history"
git push -u origin codex/be-024-vehicle-history
```

Open a PR into dev with requirement IDs, examples and test evidence. One teammate reviews. Coordinate shared route registration through Member 1; module files belong to their listed owner.

### PR checklist and acceptance criteria

- [ ] Successful request returns 200 and exactly the documented safe response shape.
- [ ] Missing/expired session cookie returns401; inactive account and unauthorized role return403.
- [ ] Verify 404 Vehicle not found.
- [ ] Invalid/unknown input fields are rejected; no unexpected database changes occur on failure.
- [ ] GET has no data-changing side effects; list pagination/counts stay consistent.
- [ ] All errors go through centralized error middleware; no sensitive fields or stack traces escape.

## 4. Logic Diagram

```mermaid
flowchart TD
    A["GET /api/vehicles/:vehicle_id/orders"] --> B["Verify token, current account and role"]
    B --> C["Validate allowed input"]
    C --> D["Read records and apply safe projection"]
    D --> E["Return 200 documented response"]
    B -. Failure .-> F["Centralized error middleware"]
    C -. Failure .-> F
    D -. Failure .-> F
```
