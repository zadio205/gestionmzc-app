## Why
Superadmin users navigate via sidebar links that point to `/superadmin/...`, but the app only defines admin routes under `/admin/...`. This mismatch yields Next.js 404 pages and blocks superadmin access to management screens.

## What Changes
- Align superadmin navigation with existing admin route structure while preserving role-based authorization.
- Update sidebar configuration to route superadmin entries to `/admin/...` paths and ensure dashboards redirect correctly.
- Add automated test coverage (or documented manual check) to prevent future regressions in role-to-route mapping.

## Impact
- Affected specs: navigation
- Affected code: `src/components/ui/Sidebar.tsx`, `src/middleware.ts`, auth redirect logic
