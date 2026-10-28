# Deployment checklist

Implement BE-050 from docs/api/foundation. Build frontend with npm run build; deploy frontend/dist with SPA fallback. Start backend with npm start from root. Configure production environment secrets separately, HTTPS, exact CORS origin, trusted proxy topology, persistent MySQL and SMTP.

Do not deploy placeholders as a completed system. Implement/test business endpoints, production rate-limit store, seed/migration scripts, readiness, backup/restore and privacy checks first. Installation is disabled by default.

Official setup references: https://vite.dev/guide/ and https://expressjs.com/en/4x/api/.

## Hybrid scaffold update

The entry point is now backend/index.js; the main router is backend/src/api/routes.js. Feature implementation files are empty and planned routes are documented rather than registered. Follow docs/TEAM-GUIDE.md for coding freedom; retain the agreed API behavior and normalized SQL mapping.
