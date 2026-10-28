# Abe Garage normalized database design

This fresh-database schema replaces the earlier ten-table proposal. It has **14 tables and five read-only views**. It targets MySQL 8.0.16 or later, including MySQL 8.4. It is not a migration for an existing populated database.

The operational records are designed to third normal form under the business assumptions below. Historical service versions and invoice document fields represent facts at a particular time, rather than copies of mutable current records. Normalization depends on these functional dependencies, not simply on the number of tables or absence of calculated columns.

## Files

- [schema.sql](../../backend/db/schema.sql): authoritative tables, keys, checks, indexes, views, integrity triggers and fixed role seeds.
- [ER diagram JPG](Abe-Garage-Normalized-ER.jpg): all 14 tables; table relationships reference the same SQL names.

## Changes from the earlier design

| Earlier design                                           | Normalized replacement                                                                          |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| orders.customer_id duplicates the vehicle owner          | Obtain it through orders.vehicle_id -> vehicles.customer_id                                     |
| Names, descriptions and hours copied onto every job line | Immutable service_versions; each job references exactly one version                             |
| Repeated approver fields on orders                       | Append-only order_approvals records, including reapprovals                                      |
| Invoice columns/JSON attached to orders                  | Separate invoices with atomic historical document fields                                        |
| paid flag, paid_at and collector on orders               | One cash_payments row per settled invoice; absence means unpaid                                 |
| Stored subtotal, VAT amount and total                    | Calculate consistently in v_order_financials; one subtotal-level VAT rounding                   |
| Repeated invoice line records or frozen JSON lines       | Read the immutable order lines and immutable service version referenced by that invoice's order |

The agreed_price on a job line can differ from a catalogue version's default_price. These are different facts, so agreed_price is not redundant even when the initial values happen to match.

Invoice garage/customer/vehicle fields are historical issue-time values. For example, customer_email on an invoice is not required to equal customers.email after a profile change. They are ordinary scalar columns, not a JSON payload or a list stored in one column. Splitting these one-to-one fields into more tables would not by itself improve their normal form.

## Business assumptions and integrity

1. One garage, one currency, cash-only full settlement. No partial payments, refunds, credit notes, invoice reissue, inventory, vehicle transfers or multi-branch accounting.
2. Each vehicle has one customer; this release prohibits changing that owner. The database trigger enforces this so historical orders cannot silently acquire another customer. A future ownership-transfer feature needs a separate ownership-history entity.
3. Each order refers to one vehicle and derives its customer. Its VAT rate and currency are agreed historical values and cannot be edited. Editing current garage settings affects new orders only.
4. The newest version_number is the service's current revision. Descriptive/price/hour edits INSERT a new service_versions row; old revisions are immutable. active belongs to the service identity and hides all of its revisions from new selection.
5. Price uniqueness and service membership are different concerns. uq_order_service_version blocks the identical revision twice. The application also checks that different revisions of the same service do not appear twice on one order.
6. There is at most one immutable invoice per order and at most one full cash settlement per invoice. Its amount is the invoice's computed total, so cash_payments has no second amount to drift. Supporting actual tendered amount/change or partial payments would require additional fields and rules.
7. Issued invoices use frozen order-line prices, immutable service versions and immutable order VAT/currency. No invoice_lines table is needed because there is no invoice-specific quantity, discount, price adjustment or subset of jobs in this scope.
8. Invoice document fields are issued historical facts. Later customer, vehicle or settings edits cannot change them. No current customer_id or vehicle_id is duplicated in invoices.
9. Status is the workflow's persisted state, not a status label duplicated with a lookup name. Approval decisions and line progress drive transitions in one application transaction. This design does not claim that all business logic can be expressed in CHECK constraints.
10. All datetimes are UTC. All monetary columns are DECIMAL; positive exact-decimal ROUND applies VAT once to subtotal. Inputs must fit per-line limits and the maximum 100-line order size.

## Read-only views

| View                 | Purpose                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------- |
| v_current_services   | Current service name, price and labor hours from latest revision                         |
| v_order_financials   | Subtotal, VAT amount and total; never join history into the sum                          |
| v_orders             | Customer ID, totals, paid metadata and latest approval decision for API mapping          |
| v_invoice_financials | Historical invoice header with calculated immutable billing total and live paid metadata |
| v_invoice_lines      | Issued invoice's frozen line descriptions, hours and agreed prices                       |

These views are internal read models, not automatic public API responses. In particular, v_orders includes internal notes and the private order hash. Public tracking must use an explicit safe projection.

## Mapping to the already designed APIs

The endpoint URLs and outward JSON may remain the same; implementation queries must change.

- POST /api/orders: accept customer_id for validation, but store only vehicle_id. Validate its owner equals the supplied customer. Resolve each service_id to the current service_version_id inside the transaction. Persist agreed_price from the chosen revision or allowed custom price.
- Vehicle JSON field type maps to the SQL column vehicle_type. Explicitly alias it in serializers.
- Service create writes services and initial service_versions together. Service edit appends a revision for any name/description/price/hour change; deactivation changes services.active only. Serialize the current version as the service response.
- Service name uniqueness across current versions remains an application rule: serialize catalogue name-changing writes using a shared MySQL named lock (same pooled connection, release in finally), query v_current_services, and reject conflicts with 409. Historical names intentionally repeat across revisions; UNIQUE(name) on service_versions would be wrong. Name and version allocation happen in one transaction while locking the service identity.
- GET order/customer history: join vehicles to derive customer_id; read totals from v_order_financials and paid metadata via invoice/payment. Do not query removed order total/payment columns.
- Approval endpoint inserts order_approvals and updates orders.status together. Derive approved_by/approved_at/approval_method from the latest approved decision only when current scope is approved. A pending reapproval response clears those current-approval fields, while preserving the old decision in history.
- Add extra work: lock parent order, change status to Awaiting approval before inserting the extra unstarted line, append history, then obtain reapproval. Never discard already performed work.
- POST invoice: lock completed order and current master rows, insert header snapshots from those rows. Read line descriptions and prices via v_invoice_lines. Do not write invoice_snapshot JSON. First success 201, repeated issue 200 with original invoice.
- PATCH payment: lock parent order and issued invoice, insert cash_payments once. Return paid=true and existing data for a retry. No order paid flag to update.
- Dashboard money: join cash_payments -> invoices -> v_order_financials and filter cash_payments.paid_at by UTC-converted business-period boundaries. Unpaid means status=4 and no payment row.
- History.details is optional plain explanatory text in this normalized version; decision/method/actor/timestamps have dedicated columns in order_approvals. Adjust the earlier details JSON expectation to text or present a structured DTO produced by the service.
- Reset IDs are INT UNSIGNED in this fresh schema for simple numeric API handling; all FK types match. Password reset token hashes and token_version behavior are unchanged.

## Application rules still required

Foreign keys, CHECK constraints and triggers do not replace these rules:

- Enforce authentication, roles, current active status, assignment ownership and token revocation.
- Validate canonical email/phone/plate, current-year bounds, field lengths and unknown properties.
- Lock the parent order first for every line, status, approval, invoice or payment mutation; then lock other records in consistent order. Handle deadlocks with bounded transaction retry where safe.
- Save an order with at least one line atomically. MySQL cannot enforce a minimum child-row count using a normal FK. Ensure line replacement never commits an empty order.
- Ensure assigned employee is an active Technician; never change an already finished line's assignment. One database FK cannot express role-based eligibility.
- Maintain 1->2/5,2->3,3->4 status rules and reapproval behavior. Update completed_at at the same time as status=4. Do not allow state changes that disagree with approvals/job states.
- Guard the last active Admin and increment token_version for password/security changes.
- Record status and billing changes in history; email only after commit. SMTP failure cannot undo a saved order.
- Populate invoice snapshots from trusted database records, not caller-supplied customer/garage/vehicle data. Freeze service-version rows and billed job facts after issue; only technician_note may change on an invoiced line.
- Preserve referenced master records through deactivation. Grant the runtime DB account least privilege; no hard DELETE on roles,employees,customers,vehicles,services,orders or garage_settings. Unstarted draft-line replacement and expired reset-token cleanup need narrowly controlled DELETE access.

## Running the SQL

Create an empty database in MySQL first. Then run:

```bash
mysql -u <schema-owner> -p <empty_database> < schema.sql
```

The MySQL CLI or Workbench script runner understands DELIMITER for trigger definitions. If using mysql2, execute each CREATE TRIGGER as a complete SQL statement rather than sending DELIMITER commands to the server. Do not enable arbitrary multi-statement user input.

The file seeds only fixed roles. Create the initial Admin using a bcrypt hash from the installer and populate garage_settings from confirmed garage configuration. No default Admin password is included. schema_migrations belongs to the migration tool and is not a business table in this design.

The script deliberately has no DROP TABLE, no database selection, and no IF NOT EXISTS that might hide an incompatible existing table. It is not safe to treat it as an in-place upgrade to the previous design. DDL has implicit commits; use an empty database and a migration ledger for deployment.

## Verification status

The files are checked for table/reference coverage, matching FK column types, view dependencies and diagram/table agreement. A MySQL server/client was not available in this workspace, so the script has not been executed against MySQL. Run it in a fresh development database and perform the API integration tests before deployment.

Technical references: [MySQL CHECK constraints](https://dev.mysql.com/doc/refman/8.4/en/create-table-check-constraints.html), [MySQL views](https://dev.mysql.com/doc/refman/8.4/en/create-view.html), [MySQL triggers](https://dev.mysql.com/doc/refman/8.4/en/create-trigger.html).
