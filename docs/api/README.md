# Abe Garage backend API design and tasks

This package defines the backend implementation work for your four-person garage team. It contains 44 REST endpoint contracts and 6 shared infrastructure tasks, following the attached forum task archive’s structure: API documentation,implementation instructions,logic/Git workflow,PR checklist and Mermaid diagram. It is a design package; it does not implement or deploy the backend.

## Read in this order

1. [Task classification and owners](TASK-CLASSIFICATION.md)
2. [Shared conventions and response format](CONVENTIONS.md)
3. [Database additions supporting the contracts](DATABASE-CHANGES.md)
4. [Requirements coverage and deliberate changes](REQUIREMENTS-MAP.md)
5. Open the task file for your assigned endpoint from the index below.

## API index

| Method | Endpoint                               | Access                                                         | Owner | Task                                                                                     |
| ------ | -------------------------------------- | -------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------- |
| POST   | `/api/auth/login`                      | Public                                                         | M1    | [BE-004 Staff login](auth/be-004-login.md)                                               |
| POST   | `/api/auth/forgot-password`            | Public                                                         | M1    | [BE-005 Request password reset](auth/be-005-forgot-password.md)                          |
| POST   | `/api/auth/reset-password`             | Public                                                         | M1    | [BE-006 Reset forgotten password](auth/be-006-reset-password.md)                         |
| PATCH  | `/api/auth/password`                   | Any active staff                                               | M1    | [BE-007 Change own password](auth/be-007-change-password.md)                             |
| GET    | `/api/profile`                         | Any active staff                                               | M1    | [BE-008 Get own staff profile](auth/be-008-get-profile.md)                               |
| POST   | `/api/employees`                       | Admin                                                          | M1    | [BE-009 Create employee](employees/be-009-create-employee.md)                            |
| GET    | `/api/employees`                       | Admin; Manager limited to active technicians                   | M1    | [BE-010 List and search employees](employees/be-010-list-employees.md)                   |
| GET    | `/api/employees/:employee_id`          | Admin                                                          | M1    | [BE-011 View employee](employees/be-011-get-employee.md)                                 |
| PATCH  | `/api/employees/:employee_id`          | Admin                                                          | M1    | [BE-012 Edit or deactivate employee](employees/be-012-update-employee.md)                |
| GET    | `/api/roles`                           | Admin                                                          | M1    | [BE-013 List fixed staff roles](settings/be-013-list-roles.md)                           |
| GET    | `/api/settings`                        | Admin                                                          | M1    | [BE-014 Read garage settings](settings/be-014-get-settings.md)                           |
| PATCH  | `/api/settings`                        | Admin                                                          | M1    | [BE-015 Update garage settings](settings/be-015-update-settings.md)                      |
| POST   | `/api/customers`                       | Manager or Admin                                               | M2    | [BE-016 Register customer](customers/be-016-create-customer.md)                          |
| GET    | `/api/customers`                       | Any active staff                                               | M2    | [BE-017 List and search customers](customers/be-017-list-customers.md)                   |
| GET    | `/api/customers/:customer_id`          | Any active staff                                               | M2    | [BE-018 View customer profile and financial summary](customers/be-018-get-customer.md)   |
| PATCH  | `/api/customers/:customer_id`          | Manager or Admin                                               | M2    | [BE-019 Edit or deactivate customer](customers/be-019-update-customer.md)                |
| POST   | `/api/vehicles`                        | Manager or Admin                                               | M2    | [BE-020 Add vehicle to customer](vehicles/be-020-create-vehicle.md)                      |
| GET    | `/api/customers/:customer_id/vehicles` | Any active staff                                               | M2    | [BE-021 List a customer’s vehicles](vehicles/be-021-list-customer-vehicles.md)           |
| GET    | `/api/vehicles/:vehicle_id`            | Any active staff                                               | M2    | [BE-022 View vehicle](vehicles/be-022-get-vehicle.md)                                    |
| PATCH  | `/api/vehicles/:vehicle_id`            | Manager or Admin                                               | M2    | [BE-023 Edit vehicle details](vehicles/be-023-update-vehicle.md)                         |
| GET    | `/api/vehicles/:vehicle_id/orders`     | Any active staff                                               | M2    | [BE-024 View vehicle service history](vehicles/be-024-vehicle-history.md)                |
| POST   | `/api/services`                        | Admin                                                          | M2    | [BE-025 Create repair service](services/be-025-create-service.md)                        |
| GET    | `/api/services`                        | Any active staff                                               | M2    | [BE-026 List staff service catalogue](services/be-026-list-services.md)                  |
| PATCH  | `/api/services/:service_id`            | Admin                                                          | M2    | [BE-027 Edit or deactivate service](services/be-027-update-service.md)                   |
| GET    | `/api/public/services`                 | Public                                                         | M2    | [BE-028 Read public services and prices](services/be-028-public-services.md)             |
| POST   | `/api/orders`                          | Manager or Admin                                               | M3    | [BE-029 Create repair order and estimate](orders/be-029-create-order.md)                 |
| GET    | `/api/orders`                          | Any active staff                                               | M3    | [BE-030 List and filter orders](orders/be-030-list-orders.md)                            |
| GET    | `/api/orders/:order_id`                | Any active staff                                               | M3    | [BE-031 View repair order detail](orders/be-031-get-order.md)                            |
| PATCH  | `/api/orders/:order_id`                | Manager or Admin                                               | M3    | [BE-032 Edit estimate or order notes](orders/be-032-update-order.md)                     |
| PATCH  | `/api/orders/:order_id/approval`       | Manager or Admin                                               | M3    | [BE-033 Record estimate approval or decline](orders/be-033-record-approval.md)           |
| POST   | `/api/orders/:order_id/lines`          | Manager or Admin                                               | M3    | [BE-034 Add extra work and request reapproval](orders/be-034-add-extra-job.md)           |
| PATCH  | `/api/order-lines/:line_id/technician` | Manager or Admin                                               | M2    | [BE-035 Assign technician to job line](technician-jobs/be-035-assign-technician.md)      |
| GET    | `/api/my-jobs`                         | Technician only                                                | M2    | [BE-036 List my technician jobs](technician-jobs/be-036-my-jobs.md)                      |
| PATCH  | `/api/order-lines/:line_id/status`     | Assigned Technician; Manager or Admin                          | M2    | [BE-037 Start or finish technician job](technician-jobs/be-037-update-job-status.md)     |
| PATCH  | `/api/order-lines/:line_id/note`       | Assigned Technician; Manager or Admin                          | M2    | [BE-038 Add or edit technician work note](technician-jobs/be-038-job-note.md)            |
| GET    | `/api/orders/:order_id/estimate`       | Manager or Admin                                               | M3    | [BE-039 Read printable estimate data](orders/be-039-get-estimate.md)                     |
| POST   | `/api/orders/:order_id/invoice`        | Manager or Admin                                               | M4    | [BE-040 Issue immutable invoice](billing/be-040-issue-invoice.md)                        |
| GET    | `/api/orders/:order_id/invoice`        | Manager or Admin                                               | M4    | [BE-041 Read issued invoice](billing/be-041-get-invoice.md)                              |
| PATCH  | `/api/orders/:order_id/payment`        | Manager or Admin                                               | M4    | [BE-042 Record cash payment](billing/be-042-record-cash-payment.md)                      |
| GET    | `/api/public/orders/:order_hash`       | Public with valid unguessable order hash                       | M4    | [BE-044 Read private-link customer order status](tracking/be-044-public-order-status.md) |
| POST   | `/api/orders/:order_id/resend-email`   | Manager or Admin                                               | M4    | [BE-045 Resend order tracking email](tracking/be-045-resend-status-email.md)             |
| GET    | `/api/dashboard`                       | Manager or Admin                                               | M4    | [BE-046 Read operational dashboard](dashboard/be-046-get-dashboard.md)                   |
| POST   | `/api/install`                         | Deployment operator with setup secret; unavailable after setup | M1    | [BE-047 Initialize and lock installation](setup/be-047-install.md)                       |
| GET    | `/api/health`                          | Public                                                         | M1    | [BE-048 Check API readiness](setup/be-048-health.md)                                     |

## Supporting files

- [Contract fixtures](contracts.json) are the machine-readable source of truth for endpoint request/query/success examples and ownership. [OpenAPI](openapi.json) is generated from them with `npm run generate:openapi`; do not edit it directly.
- foundation/:6 non-endpoint implementation and verification tasks.
- Every endpoint file has request body (or None),success JSON,permissions,error cases,business rules,dependencies,paths,Git instructions,acceptance checks and logic diagram.

## Sources

- User-provided garage requirements DOCX and UI ER diagram control project scope. Later conversation decisions override original examples: no v1,no /me,no Google,centralized errors,password reset,JWT token-version revocation.
- C:/Users/Yeabsira/Downloads/ai-powered-forum-project-main/tasks/backend.zip supplies the task-document format only. Its public forum registration/AI features are not garage requirements.
- C:/Users/Yeabsira/Downloads/EvangadiForum.zip supplies the reference controller/service/error flow; reusable reset JWT behavior was replaced by single-use hashed tokens.
- Technical references are linked in CONVENTIONS.md.

[Required fields,optional inputs and response variants](VALIDATION.md) complete the endpoint examples.

## Current database model

The normalized 14-table schema in ../../backend/db/schema.sql supersedes the original ten-table DATABASE-CHANGES proposal. Read ../database/README.md before implementing any SQL. URLs and outward JSON contracts are retained except the explicitly documented history-details mapping.

## Hybrid scaffold update

The entry point is now backend/index.js; the main router is backend/src/api/routes.js. Feature implementation files are empty and planned routes are documented rather than registered. Follow docs/TEAM-GUIDE.md for coding freedom; retain the agreed API behavior and normalized SQL mapping.
