# Task BE-030: List and filter orders

**Endpoint**: `GET /api/orders`

**Owner**: Member 3 · **Priority**: Must · **Requirement**: FR-ORD-05 / FR-INV-04

**Dependencies**: BE-003. Dependencies describe contracts and integration order; use fixtures to begin development before the corresponding endpoint is complete.

## 1. API Documentation

- **Method**: `GET`
- **URL**: `/api/orders`
- **Access**: Any active staff
- **Authentication**: session cookie set by `POST /api/auth/login` (see [AUTH-DESIGN.md](../AUTH-DESIGN.md))
- **Content-Type**: `application/json`

### Request body

None. Do not send a JSON body.

### Query parameters example

```json
{
  "search": "Sara",
  "status": 1,
  "paid": false,
  "page": 1,
  "limit": 10
}
```

See [shared conventions](../CONVENTIONS.md) for types, limits and defaults. All filters are optional. Endpoint-specific behavior is described below.

### Success response (200)

```json
{
  "status": "success",
  "message": "List and filter orders successful",
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
        "completed_at": null
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

1. Define route and middleware in `backend/src/api/orders/routes/order.route.js`.
2. Add `listOrdersValidation` in `backend/src/api/orders/validations/order.validation.js`.
3. Implement `listOrdersController` in `backend/src/api/orders/controller/order.controller.js`. Extract allowlisted inputs and verified actor context only.
4. Implement `listOrdersService` in `backend/src/api/orders/service/order.service.js`. Keep business rules and SQL out of controllers.
5. Share transactions, money/status helpers and notification adapter as described in foundation tasks; do not duplicate other modules’ logic.
6. On errors call `next(error)` from controller catches or use the shared async wrapper. Do not send competing error formats.

## 3. Logic & Git Instructions

### Logic steps

1. Support search by customer first/last name or plate; status 1–5, paid boolean, customer_id,vehicle_id,unpaid_only boolean and common pagination.
2. unpaid_only=true means status=4 AND paid=false; reject conflicts such as paid=true or status other than 4. paid=false alone includes non-completed unpaid orders.
3. Use stable created_at DESC,order_id DESC. Do not include customer contact details, internal notes or tracking secret in list summaries.

### Git workflow

```bash
git checkout dev
git pull --ff-only origin dev
git checkout -b codex/be-030-list-orders
# Implement and run task-specific checks
git add <changed-files>
git commit -m "[BE-030] List and filter orders"
git push -u origin codex/be-030-list-orders
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
    A["GET /api/orders"] --> B["Verify token, current account and role"]
    B --> C["Validate allowed input"]
    C --> D["Read records and apply safe projection"]
    D --> E["Return 200 documented response"]
    B -. Failure .-> F["Centralized error middleware"]
    C -. Failure .-> F
    D -. Failure .-> F
```
