## Context
Role responsibilities are currently blurred because superadmins reuse admin routes and collaborators/clients share partially overlapping navigation. We must realign routing, middleware guards, and navigation so each role lands on the correct workspace while reusing shared components where appropriate.

## Goals / Non-Goals
- Goals: Provide separate `/superadmin` workspace, keep `/admin` as full-feature hub, enforce collaborator/client restrictions, and document the role matrix.
- Non-Goals: Redesign individual feature UIs, overhaul Supabase schema beyond access metadata, or introduce new business workflows.

## Decisions
- Introduce new route namespace `/superadmin/**` for platform management views, wiring redirects and middleware accordingly.
- Keep shared feature components (e.g., dashboard widgets, GED) but wrap them in role-aware pages to simplify navigation and breadcrumbs.
- Centralize role-to-route mapping in middleware and a reusable helper consumed by sidebar/header components.

## Risks / Trade-offs
- Duplicate page files for similar layouts increases maintenance; mitigated via shared components.
- Middleware and navigation changes can regress existing access; plan regression checklist and optional smoke tests.
- Requires coordination with the pending `update-superadmin-routing` change to avoid conflict.

## Migration Plan
1. Land shared helpers and adjust middleware to honor new map while preserving old paths temporarily with redirects.
2. Scaffold `/superadmin` pages and refactor admin/collaborateur/client pages as needed.
3. Update navigation and hooks; verify each role's happy path manually or via tests.
4. Remove temporary redirects once front-end navigation is updated.

## Open Questions
- Do superadmins need visibility into collaborator/client data, or only admin creation? (clarify with stakeholders)
- Should collaborators inherit admin dashboards verbatim or a trimmed version? (requires UX input)
