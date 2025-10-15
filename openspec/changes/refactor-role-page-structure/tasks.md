## 1. Discovery
- [x] 1.1 Inventory current pages/components per role and document gaps vs desired map
- [ ] 1.2 Confirm data requirements (e.g., client scoping) for each role with existing services

## 2. Superadmin Workspace
- [x] 2.1 Scaffold `/superadmin` route tree with dashboard + admin management pages
- [x] 2.2 Migrate platform management components (or create placeholders) from admin area

## 3. Admin & Collaborateur Alignment
- [x] 3.1 Ensure `/admin` retains full tooling and exposes collaborator/client management
- [ ] 3.2 Adjust `/collaborateur` routes to include all allowed features except user management, reusing shared components

## 4. Client Experience
- [x] 4.1 Restrict `/client` routes to dashboard, GED, social simulation, tasks, chat, profile tied to client context
- [ ] 4.2 Validate data filters enforce client-specific content (no cross-account leakage)

## 5. Access Control & Navigation
- [x] 5.1 Update middleware redirects and guard tables to reflect new hierarchy
- [x] 5.2 Update sidebar/header navigation to show correct links per role
- [ ] 5.3 Add regression checks (manual or automated) for role-based navigation and API access

## 6. Documentation & Cleanup
- [x] 6.1 Update `openspec/project.md` and relevant READMEs to describe the role matrix
- [ ] 6.2 Coordinate with `update-superadmin-routing` change and reconcile overlapping code
