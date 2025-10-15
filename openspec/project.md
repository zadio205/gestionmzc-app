# Project Context

## Purpose
Provide a multi-role SaaS platform for accounting firms (Masyzarac) to manage client ledgers, collaborate with collaborators, and exchange supporting documents securely. The app centralizes user management, document workflows, and future real-time collaboration features while integrating directly with Supabase for data persistence and auth.

## Tech Stack
- Next.js 15 App Router (React 18, Server Actions for data flows where needed)
- TypeScript with strict mode and `@/*` path aliasing
- Tailwind CSS 4 with PostCSS pipeline
- Supabase (PostgreSQL, Auth, Storage) as backend-as-a-service
- Zod + React Hook Form for form validation
- Socket.IO planned for collaborative messaging

## Project Conventions

### Code Style
- ESLint (config from `eslint-config-next`) enforces React/TypeScript & accessibility rules; run via `npm run lint` before PRs
- Formatting follows Prettier defaults via IDE integration (no committed config yet, keep 2 spaces and trailing commas)
- Use functional React components, hooks, and server components under `src/app`
- Keep TypeScript models in `src/types` or `src/models`, name files in kebab-case for components and camelCase for utilities

### Architecture Patterns
- Next.js App Router with role-specific routes under `src/app/{admin,collaborateur,client}`
- Feature folders in `src/components`, `src/hooks`, and `src/services` grouped by domain (auth, dashboard, ledger, etc.)
- Supabase client helpers live in `src/lib`; API routes wrap Supabase calls and enforce role checks
- Context providers (e.g., `NotificationContext`) expose UI state; hooks wrap Supabase and caching logic
- Plan to introduce server-side actions and caching layers for ledger analytics

### Testing Strategy
- No automated test suite yet; rely on manual regression through role-based dashboards
- Near-term goal: add unit tests for hooks/services (Vitest or Jest) and Playwright smoke flows for auth + admin dashboard
- Database scripts under `scripts/` include integrity checks (`check-*.js`) that should run before releases

### Git Workflow
- Default branch `main` reflects deployable state; protect via reviews
- Create feature branches from `main` (`feature/...`, `fix/...`), open PRs with concise descriptions referencing specs in `openspec/`
- Follow conventional-leaning commit messages (`feat:`, `fix:`) when practical; squash merge via PR
- Keep schema migrations and Supabase scripts versioned in `scripts/` and reference them in PR descriptions

## Domain Context
- Audience: French accounting firms needing collaborative ledgers, document archiving (GED), and client communication
- Roles drive UI and access: Admin (global control), Collaborateur (manages assigned clients), Client (self-service portal)
- Route namespaces map to roles: `/superadmin` (platform governance, admin onboarding), `/admin` (full tooling + user management), `/collaborateur` (operational tools minus user admin), `/client` (scoped workspace)
- Ledger tools must align with French accounting practices (balance, justificatifs) and maintain audit trails
- Document workflows require tagging, permissions, and future OCR/metadata enrichment

## Important Constraints
- Must respect Supabase Row Level Security policies defined in `scripts/create-*-rls.sql`
- Handle personally identifiable and financial data; stay compliant with GDPR (data residency, consent, deletion)
- Optimize for Vercel deployment limits (serverless function timeouts, cold starts)
- Ensure Tailwind 4 + Next.js 15 compatibility; avoid unsupported legacy CSS tooling
- Offline access not in scope; browser-only usage is acceptable

## External Dependencies
- Supabase (Auth, Postgres, Storage) - primary data platform
- Nodemailer SMTP integration for transactional emails (password/reset, invites)
- Potential Vercel deployment environment for hosting
- Socket.IO (planned) for real-time messaging layer
