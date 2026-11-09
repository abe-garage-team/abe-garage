# settings

Routes are mounted at /api/roles and /api/settings. Every route requires a logged-in Admin.

- BE-013 · `GET /api/roles` · the three fixed staff roles in id order
- BE-014 · `GET /api/settings` · the single garage settings row (503 if installation never ran)
- BE-015 · `PATCH /api/settings` (planned)

Read [the team guide](../../../../docs/TEAM-GUIDE.md) for shared API contracts and routing. No function names or controller wrappers are mandatory.
