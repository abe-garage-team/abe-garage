# Frontend API Services

All backend HTTP communication is centralized here in `src/services/`.

## Architecture Convention

- **`src/services/core/api-client.js`**: Core Fetch API client managing headers, JSON serialization, and automatic 401 token expiration.
- **`src/services/core/session.js`**: In-browser session management (JWT token and active employee).
- **`src/services/<domain>.service.js`**: Domain-specific API service modules (e.g. `auth.service.js`, `customer.service.js`, `order.service.js`, `catalog.service.js`).
  - _Note_: We use `catalog.service.js` for garage repair services to eliminate awkward `services/services` folder paths.

## Rule for Team Members

1. **Pages & Components** in `src/features/<domain>/` must **not** perform raw `fetch()` calls.
2. Instead, import and call the clean functions exported from `src/services/<domain>.service.js`.
