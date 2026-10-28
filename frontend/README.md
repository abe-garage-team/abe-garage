# Frontend

React 18 and Vite with all 30 planned page files, public/staff/print layouts, role-aware menu and shared controls retained.

Pages currently render PagePlaceholder. Replace their contents with your implementation. Generated dummy feature components and endpoint-specific API wrappers were removed; their folders remain. Create the files you actually need with names and organization your owner chooses.

The shared API client/session helpers remain in `src/services/core`. Keep each feature's API wrapper in `src/services/<domain>.service.js`; pages and components must not call `fetch()` directly. Use `service-catalog.service.js` for garage services, rather than an ambiguous `services/services` path. Keep the `/api` base and agreed request/response shapes.

UI guards do not replace server authorization. Login/profile APIs are still unimplemented, so protected page placeholders stay behind the existing guard until the auth owner connects them.

Bootstrap CSS remains for shared controls. Unused React Bootstrap and date-fns packages were removed; add packages when needed. Approved template assets belong in src/assets.

Run npm run dev:frontend or npm run build from the project root. Read ../docs/TEAM-GUIDE.md for shared expectations.
