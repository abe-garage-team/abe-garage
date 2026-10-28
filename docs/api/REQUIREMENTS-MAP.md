# Backend requirements coverage

| Requirement area        | Tasks                                             | Notes                                                                |
| ----------------------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| FR-INS                  | BE-002,BE-047                                     | POST installer; locked/idempotent underlying setup                   |
| FR-AUTH                 | BE-003 through008                                 | Logout is frontend; no /me or Google                                 |
| FR-EMP                  | BE-009 through013                                 | Admin management; Manager technician lookup                          |
| FR-CUS                  | BE-016 through019,BE-030                          | Profile summary plus paginated order history                         |
| FR-VEH                  | BE-020 through024                                 | Read/update/owned vehicles/history                                   |
| FR-SRV                  | BE-025 through028                                 | Catalogue and public list                                            |
| FR-ORD                  | BE-029 through032,BE-034                          | Four UI steps culminate in one atomic create                         |
| FR-EST                  | BE-033,BE-034,BE-039                              | Recorded approval,decline,extra-work reapproval,print data           |
| FR-TEC                  | BE-035 through038                                 | Assignment,own jobs,progress,notes                                   |
| FR-INV                  | BE-040 through042,BE-030                          | Invoice issue/read,payment,unpaid filters                            |
| FR-TRK                  | BE-029,BE-037,BE-043 through045                   | Hash,tracking,automatic emails,resend                                |
| FR-WEB                  | BE-028,BE-044                                     | Public pages/404/code box are frontend; no unused backend pages APIs |
| FR-DSH                  | BE-003,BE-046                                     | Menus are frontend,server roles and counters backend                 |
| NFR-01 through09        | BE-001/002/003,CONVENTIONS,BE-049                 | Security,transactions,serialization,1000-row performance             |
| NFR-10 through12        | Frontend phase; BE-039/041 data supports printing | Field error shapes defined backend                                   |
| NFR-13 through15        | BE-049 and all task PR checklists                 | Shared Postman,every endpoint tested,module layer convention         |
| Password-reset addition | BE-005/006/007,DATABASE-CHANGES                   | Single-use15min tokens,token_version revocation                      |

## Intentional differences from source examples

- /api without v1; plural resources; PATCH partial updates; Authorization:Bearer instead of x-access-token.
- Central {status,message,data} response; reference task archive’s {success,user,token} examples are not copied as garage conventions.
- /api/profile instead of /me; login response contains access_token and employee.
- POST /api/install changes state; HTTP installer locks after setup. Idempotent internal migrations resolve the document’s competing repeat-success/locked-public-route requirements.
- Invoice POST separates issuance from safe GET read. Extra invoice/snapshot columns explicitly proposed,not silently assumed.
- Member2 owns technician endpoints to rebalance Member3 workload. No microservices or separate deployments.
- Reapproval decline with already performed work is409 rather than closing performed work; expanded cancellation/credit handling deferred.
- Monetary example230.00 +15% uses ETB as a proposed single launch currency,not a currency conversion from source’s dollar example. Team confirms currency before launch.
