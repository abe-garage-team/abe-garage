# Request field and response variants

All request examples are concrete examples,not JSON Schema. This table defines presence rules. Unknown fields are rejected. A required field cannot be null; omitted optional fields use the stated default. PATCH accepts only listed mutable fields,at least one. IDs are positive integers and decimal strings accept exactly the precision/range in CONVENTIONS.

| Endpoint/task                                         | Required input                                             | Optional input/default                                                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| BE-004 login                                          | email,password                                             | None                                                                                                    |
| BE-005 forgot password                                | email                                                      | None                                                                                                    |
| BE-006 reset password                                 | token,new_password                                         | None                                                                                                    |
| BE-007 change password                                | current_password,new_password                              | None                                                                                                    |
| BE-009 employee create                                | first_name,last_name,email,phone,password,role_id          | active=true                                                                                             |
| BE-012 employee patch                                 | At least one permitted field                               | first_name,last_name,email,phone,role_id,active;omission preserves current value                        |
| BE-015 settings patch                                 | At least one permitted field                               | name,address,phone,email,vat_rate                                                                       |
| BE-016 customer create                                | first_name,last_name,email,phone                           | active=true                                                                                             |
| BE-019 customer patch                                 | At least one permitted field                               | first_name,last_name,email,phone,active                                                                 |
| BE-020 vehicle create                                 | customer_id,year,make,model,type,mileage,plate,color       | vin=null                                                                                                |
| BE-023 vehicle patch                                  | At least one permitted field                               | year,make,model,type,mileage,plate,vin,color;vin may be null                                            |
| BE-025 service create                                 | name,description,price,labor_hours                         | active=true                                                                                             |
| BE-027 service patch                                  | At least one permitted field                               | name,description,price,labor_hours,active                                                               |
| BE-029 order create                                   | customer_id,vehicle_id,lines (1..100),estimated_ready_date | notes_for_customer=null,internal_notes=null;line_price optional per line if custom pricing implemented  |
| BE-032 order patch                                    | At least one permitted field                               | lines,estimated_ready_date,notes_for_customer,internal_notes;notes may be null;state restrictions apply |
| BE-033 approval                                       | decision,approval_method                                   | decision approved or declined;method phone or in_person                                                 |
| BE-034 extra job                                      | service_id                                                 | line_price=current service price                                                                        |
| BE-035 assign                                         | technician_id                                              | None;unassign unsupported                                                                               |
| BE-037 job progress                                   | line_status                                                | Only1(start) or2(done);0 is not a new transition target                                                 |
| BE-038 work note                                      | technician_note                                            | null clears note;otherwise max2000 chars                                                                |
| BE-042 payment                                        | paid=true                                                  | No client amount,date,collector or method                                                               |
| BE-040 invoice issue / BE-045 resend / BE-047 install | No JSON body                                               | Reject unexpected input;install seed from env                                                           |
| Every GET                                             | No JSON body                                               | Only endpoint-documented query parameters                                                               |

## Role projections and state variants

- GET employees Admin fields:employee_id,first_name,last_name,email,phone,role_id,role_name,active,created_at. Manager fields:employee_id,first_name,last_name,role_name. Same employees/pagination wrapper.
- GET order Technician projection:remove customer.email,customer.phone,internal_notes,order_hash,tracking_url;retain permitted order/vehicle/job/history data. Manager/Admin receive full example. Public tracking uses a completely separate allowlist.
- Approval decline response has same keys as approval but status5,status_name Declined,approved_by=null,approved_at=null. approval_method retains recorded channel; actor/time/decision recorded in history.details. Reapproval can derive status3/4.
- Repeating invoice issuance returns200 rather than201 with identical issued document. Repeating paid=true returns200 with original payment metadata. Job-status replay returns current parent status and original line timestamps,not a fabricated new start/completion.
- Resend failure example:HTTP503,{status:error,message:Email could not be sent,data:{order_id:24,email_status:failed}}. Strings shown here without quotes for readability;actual HTTP bodies are valid JSON. Automatic send failures never replace order201/completion200.
- Empty list response uses resource array=[],pagination:{page:1,limit:10,total:0,total_pages:0};past-end pages retain actual total/total_pages.
- Every error uses the shared envelope; validation error keys match offending fields such as employee_id,lines,token or email. The email error block in task documents illustrates shared structure,not a mandatory field for every route.

## HTTP status distinctions

400 malformed fields;401 authentication failure/revocation;403 denied role/inactive caller;404 missing record;409 existing conflicting record or invalid business state;429 rate limit;500 internal failure;503 controlled unavailable dependency. Public reset/tracking exceptions follow their task contract.

## Integration ownership

Member3 provides shared helpers calculateOrderTotals(lockedOrder,lines),deriveOrderStatus(lines),assertOrderMutationAllowed(order,operation),and appendOrderHistory(connection,event). Member2 uses them for technician mutations. Member4 uses totals/snapshots without rewriting calculation rules. Function names are proposed interfaces to agree on Day1;use explicit connection argument for transaction-aware calls.
