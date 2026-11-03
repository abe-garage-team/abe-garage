# Shared Postman workspace

Import `Abe-Garage.postman_collection.json` and `local.environment.example.json`. The environment holds `base_url`, `frontend_origin` and the development Admin login that `npm run db:setup` creates. Commit no real passwords or customer data.

When you implement an endpoint, add its request to the collection in the folder for your module and include the change in your PR.

Authentication is a session cookie, not a token. Postman keeps cookies automatically: send `POST {{base_url}}/auth/login` once, then the other requests work. Every POST/PATCH request needs the header `Origin: http://localhost:5173` (your FRONTEND_URL) or the server answers 403 ORIGIN_NOT_ALLOWED.

The endpoint examples in docs/api/contracts.json are the agreed shapes; see docs/api/AUTH-DESIGN.md for the authentication flow.
