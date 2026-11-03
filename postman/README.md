# Shared Postman workspace

Store the collection as Abe-Garage.postman_collection.json. Use local base_url=http://localhost:5000/api. Commit no real passwords or customer data.

Authentication is a session cookie, not a token. Postman keeps cookies automatically: send `POST {{base_url}}/auth/login` once, then the other requests work. Every POST/PATCH request needs the header `Origin: http://localhost:5173` (your FRONTEND_URL) or the server answers 403 ORIGIN_NOT_ALLOWED.

The endpoint examples in docs/api/contracts.json are the agreed shapes; see docs/api/AUTH-DESIGN.md for the authentication flow.
