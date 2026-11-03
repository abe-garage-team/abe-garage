# Task BE-023: Edit vehicle details

**Endpoint**: `PATCH /api/vehicles/:vehicle_id`

**Owner**: Member 2 · **Priority**: Must · **Requirement**: FR-VEH-03

**Dependencies**: BE-020. Dependencies describe contracts and integration order; use fixtures to begin development before the corresponding endpoint is complete.

## 1. API Documentation

- **Method**: `PATCH`
- **URL**: `/api/vehicles/:vehicle_id`
- **Access**: Manager or Admin
- **Authentication**: session cookie set by `POST /api/auth/login` (see [AUTH-DESIGN.md](../AUTH-DESIGN.md))
- **Content-Type**: `application/json`
- **Path parameters**: `vehicle_id` (positive integer)

### Request body

```json
{
  "mileage": 66500,
  "color": "Silver"
}
```

### Success response (200)

```json
{
  "status": "success",
  "message": "Edit vehicle details successful",
  "data": {
    "vehicle_id": 8,
    "customer_id": 12,
    "year": 2020,
    "make": "Toyota",
    "model": "Corolla",
    "type": "Sedan",
    "mileage": 66500,
    "plate": "AA-12345",
    "vin": "JTDBR32E720123456",
    "color": "Silver"
  }
}
```

Examples use representative fixture records. Responses may have more/fewer array elements; fields and types are contractual. Nullable fields remain present as null. Where a task documents a restricted role projection, that projection replaces the general example for that role.

### Errors

- 400 Invalid input (unless this task specifies a different public-token rule)
- 401 Missing, invalid or expired session cookie
- 403 Inactive account or insufficient role
- 404 Vehicle not found
- 409 Plate already used
- 409 Mileage cannot decrease
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
2. Add `updateVehicleValidation` in `backend/src/api/vehicles/validations/vehicle.validation.js`.
3. Implement `updateVehicleController` in `backend/src/api/vehicles/controller/vehicle.controller.js`. Extract allowlisted inputs and verified actor context only.
4. Implement `updateVehicleService` in `backend/src/api/vehicles/service/vehicle.service.js`. Keep business rules and SQL out of controllers.
5. Share transactions, money/status helpers and notification adapter as described in foundation tasks; do not duplicate other modules’ logic.
6. On errors call `next(error)` from controller catches or use the shared async wrapper. Do not send competing error formats.

## 3. Logic & Git Instructions

### Logic steps

1. Allow year,make,model,type,mileage,plate,vin,color. customer_id cannot be changed in this release because it would change ownership assumptions in historical orders.
2. Validate using create rules; require at least one allowed field. Mileage must not decrease (409); duplicate plate is 409.
3. Return updated vehicle. Issued invoice snapshots remain unchanged; current vehicle profile reflects new details.

### Git workflow

```bash
git checkout dev
git pull --ff-only origin dev
git checkout -b codex/be-023-update-vehicle
# Implement and run task-specific checks
git add <changed-files>
git commit -m "[BE-023] Edit vehicle details"
git push -u origin codex/be-023-update-vehicle
```

Open a PR into dev with requirement IDs, examples and test evidence. One teammate reviews. Coordinate shared route registration through Member 1; module files belong to their listed owner.

### PR checklist and acceptance criteria

- [ ] Successful request returns 200 and exactly the documented safe response shape.
- [ ] Missing/expired session cookie returns401; inactive account and unauthorized role return403.
- [ ] Verify 404 Vehicle not found.
- [ ] Verify 409 Plate already used.
- [ ] Verify 409 Mileage cannot decrease.
- [ ] Invalid/unknown input fields are rejected; no unexpected database changes occur on failure.
- [ ] Transaction/concurrency behavior and repeated-request behavior match the logic below.
- [ ] All errors go through centralized error middleware; no sensitive fields or stack traces escape.

## 4. Logic Diagram

```mermaid
flowchart TD
    A["PATCH /api/vehicles/:vehicle_id"] --> B["Verify token, current account and role"]
    B --> C["Validate allowed input"]
    C --> D["Check business rules and perform atomic changes"]
    D --> E["Return 200 documented response"]
    B -. Failure .-> F["Centralized error middleware"]
    C -. Failure .-> F
    D -. Failure .-> F
```
