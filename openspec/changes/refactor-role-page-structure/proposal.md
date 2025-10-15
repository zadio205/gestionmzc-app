## Why
Current routing treats superadmins as admins, which collides with the intended hierarchy: superadmins should maintain the platform and manage admin accounts, while admins operate day-to-day features shared with collaborators and clients. Without a dedicated structure, navigation is confusing, permissions drift, and future feature delivery per role becomes brittle.

## What Changes
- Restructure the route tree so each role has dedicated entry points that mirror the product hierarchy (superadmin, admin, collaborateur, client).
- Update middleware, hooks, and navigation to enforce the new access map: superadmins with platform operations, admins with full business tooling plus collaborator/client management, collaborators with all non-user-management tools, and clients with their limited workspace (dashboard, GED, social simulation, tasks, chat, profile).
- Provide clear fallbacks and documentation for role-specific redirection and shared component reuse.

## Impact
- Affected specs: role-access
- Affected code: `src/middleware.ts`, routing under `src/app/**`, sidebar/navigation components, auth hooks and context, documentation in `openspec/project.md`
- Dependencies: coordinate with `update-superadmin-routing` to avoid conflicting navigation assumptions
