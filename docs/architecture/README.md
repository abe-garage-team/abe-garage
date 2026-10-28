# Architecture and ownership

One modular application and one normalized MySQL database. This is a scaffold, not a finished garage system.

| Member | Backend ownership                                                         |
| ------ | ------------------------------------------------------------------------- |
| 1      | Setup, shared foundation, authentication, employees, settings, deployment |
| 2      | Customers, vehicles, catalogue, technician jobs                           |
| 3      | Orders, estimates, approval and shared order-domain rules                 |
| 4      | Billing, notifications, tracking, dashboard and integration coordination  |

Frontend public pages can be assigned after Member 1 finishes foundation. Each module owner also builds relevant UI; Member 4 should not receive all testing work. Keep API contracts stable, use local fixtures and fake mail adapters, and merge small reviewed PRs daily.

No Google sign-in, public staff registration, /me, /v1, inventory or online payments.

## Hybrid scaffold update

The entry point is now backend/index.js; the main router is backend/src/api/routes.js. Feature implementation files are empty and planned routes are documented rather than registered. Follow docs/TEAM-GUIDE.md for coding freedom; retain the agreed API behavior and normalized SQL mapping.
