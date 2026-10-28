# Database additions supporting API contracts

This is a proposed design update, not an executed migration. The supplied ER diagram shows logical fields without exact SQL types. Member1 must match FK types/signedness to actual DDL. Ten domain tables remain; migration metadata is operational.

## Already agreed authentication additions

- employees.token_version INT UNSIGNED NOT NULL DEFAULT0.
- password_reset_tokens:reset_id BIGINT UNSIGNED PK AUTO_INCREMENT;employee_id matching employees PK FK;token_hash CHAR(64) UNIQUE NOT NULL;expires_at DATETIME NOT NULL;used_at DATETIME NULL;created_at DATETIME NOT NULL. SHA-256 digest only.
- Index reset(employee_id,used_at,expires_at). UTC values and InnoDB.

## Additional fields needed to meet old-order and invoice requirements

| Table       | Proposed fields                        | Purpose                                                              |
| ----------- | -------------------------------------- | -------------------------------------------------------------------- |
| orders      | currency CHAR(3) NOT NULL              | Snapshot single configured currency                                  |
| orders      | invoice_number VARCHAR(32) NULL UNIQUE | Stable issued invoice identifier                                     |
| orders      | invoice_issued_at DATETIME NULL        | Persist issue time; GET never creates it                             |
| orders      | invoice_snapshot JSON NULL             | Freeze garage/customer/vehicle/line details and totals at issue time |
| order_lines | service_name VARCHAR(150) NOT NULL     | Keep historic job name after catalogue edit                          |
| order_lines | service_description TEXT NOT NULL      | Preserve historic description                                        |
| order_lines | labor_hours DECIMAL(8,2) NOT NULL      | Preserve agreed labor estimate                                       |

orders.vat_rate is already in supplied diagram; retain it as snapshot. Do not read current settings when calculating old estimates. paid/paid_at/paid_received_by stay on orders outside invoice_snapshot so payment can update without modifying invoice content.

In issued invoice JSON, store issued_at,invoice_number,garage identity,customer contact fields,vehicle fields,line descriptions/prices,subtotal,vat_rate,vat_amount,total,currency. Exclude paid metadata from frozen JSON or consistently overlay live metadata when reading; choose one canonical serializer. Internal notes and tracking hashes never enter snapshot.

No invoice table is needed for this one-invoice-per-order scope. Corrections,credit notes,partial payments and invoice reissue are outside scope. Order.customer_id and vehicle_id are immutable once created; moving ownership requires a future design.

## Clarifications

- roles1:N employees (not employees1:N roles).
- orders.created_by,approved_by,paid_received_by and order_lines.technician_id reference employees; optional references are nullable. order_history.employee_id nullable for system actions.
- service prices/line prices/totals use DECIMAL(12,2); VAT rate DECIMAL(5,2); record application range/overflow checks. No FLOAT for money.
- Required unique constraints from diagram remain; no hard-delete API for master records.
- For any proposed migration on an existing populated database, add nullable columns,backfill from known historical values and validate before making NOT NULL. Cannot reconstruct historic descriptions retrospectively with certainty.

## Structured order audit details

Add order_history.details JSON NULL alongside action. Keep action as a fixed event key;details stores safe before/after values,approval decision/method and line references. Prior approvals must remain understandable after reapproval clears current order approval fields. Do not place secrets or full raw tokens in details. Return safe details on staff order history responses;public tracking excludes history entirely.
