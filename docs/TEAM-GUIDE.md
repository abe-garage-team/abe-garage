# Team guide

We share contracts and infrastructure. Each member writes their feature implementation.

## Shared agreements

- Keep the agreed URLs, snake_case fields, role permissions and `{ status, message, data }` response format.
- Use the normalized schema at `backend/db/schema.sql`; its mapping replaces the older ten-table proposal.
- Authenticate/authorize on the server, including resource ownership. Frontend checks cannot grant access.
- Forward errors to the centralized middleware using `next(error)`, the async helper or an equivalent reviewed approach.
- Use parameterized SQL and one connection for multi-table transactions. Order locking and invoice immutability remain required.
- Keep secrets out of Git and test the actual behavior before marking an endpoint implemented.

## Members can choose

- Controller/service function names and named objects versus individual exports.
- Page/form/table component names and a useful component breakdown.
- Whether to use shared async/response helpers or equivalent explicit code.
- Additional repositories, validation helpers and subfolders when they help.

API task documents define behavior and acceptance criteria. Their suggested internal names, paths and Git examples are guidance, not a requirement to copy generated coding style.

## Implement a task

1. Read its contract and agree on dependencies/sample responses.
2. Write the controller, service and validation you need in the retained folder.
3. Import real handlers into the feature router and register its local paths with permissions.
4. Replace its page placeholder and add components only when useful.
5. Supply success/error verification, request teammate review and keep PRs small.

Customer vehicle listing belongs under the customer router at `/:customer_id/vehicles`; it may call a vehicle service. Billing and notification routers extend `/orders` with their own subpaths. Profile has a dedicated module. Separate route files handle roles, public services, My Jobs and public tracking without repeating prefixes.

Keep HTTP communication out of React components. Put each feature wrapper in `frontend/src/services/<domain>.service.js` and use the shared client in `frontend/src/services/core/api-client.js`.

`docs/api/contracts.json` is the machine-readable API source of truth. `docs/api/openapi.json` is generated from it; run `npm run generate:openapi` after changing a contract. The manifest in `scripts/scaffold-manifest.json` records route composition and is checked against the contracts; it is not a runtime dispatcher or an enforced list of function names.
