## Why
Role-restricted pages momentarily render the "Accès non autorisé" fallback before the authenticated content loads. This flash confuses users and implies access problems even when they are signed in with the correct role.

## What Changes
- Stabilize the auth hook so role verification exposes an explicit "authorizing" state and never returns a null user while a valid session is being resolved.
- Introduce a shared guard pattern for role-scoped pages that waits for the authorizing state to settle before showing either the protected UI or the unauthorized fallback.
- Update affected admin, collaborateur, and client route segments to adopt the new guard so protected content only appears after the session is confirmed.

## Impact
- Affected specs: role-access
- Affected code: `src/hooks/useAuth.ts`, role dashboards under `src/app/{admin,collaborateur,client}/**`, potential shared layout/guard components in `src/components`
- Dependencies: Supabase client session APIs already available in `useAuth`
