## ADDED Requirements
### Requirement: Superadmin Dedicated Workspace
Superadmin users SHALL access management functionality through a `/superadmin` route tree that contains platform-level dashboards and admin account administration, separate from day-to-day operational pages.

#### Scenario: Superadmin dashboard
- **WHEN** a superadmin authenticates successfully
- **THEN** the system redirects to `/superadmin/dashboard`
- **AND** the page renders without 404 errors

#### Scenario: Superadmin manages admins
- **WHEN** a superadmin selects "Gestion des administrateurs"
- **THEN** the app navigates to `/superadmin/admins`
- **AND** the page allows creating, listing, and disabling admin accounts

### Requirement: Admin Full Operations Access
Administrateur users SHALL retain access to all business tooling (dashboard, clients, documents, tasks, reports, messaging, simulations) and SHALL manage collaborator and client accounts within the `/admin` route tree.

#### Scenario: Admin opens clients page
- **WHEN** an admin clicks "Gestion des clients"
- **THEN** the app loads `/admin/clients`
- **AND** the page allows create/read/update operations for clients

#### Scenario: Admin adds collaborator
- **WHEN** an admin navigates to `/admin/users`
- **THEN** the interface exposes collaborator management actions

### Requirement: Collaborateur Restricted Admin Access
Collaborateur users SHALL access the same operational tooling as admins except user-management screens; attempts to reach `/admin/users` or equivalent SHALL redirect to `/collaborateur/dashboard` with an authorization notice.

#### Scenario: Collaborateur opens documents
- **WHEN** a collaborateur navigates to `/collaborateur/documents`
- **THEN** the GED interface renders successfully

#### Scenario: Collaborateur blocked from user management
- **WHEN** a collaborateur visits `/admin/users`
- **THEN** the system redirects to `/collaborateur/dashboard`
- **AND** displays a message explaining the restriction

### Requirement: Client Limited Workspace
Client users SHALL access only their scoped dashboard, document center (GED), social simulation, tasks, chat, and profile pages. Navigation SHALL remain under `/client` and data SHALL be filtered by the client's account.

#### Scenario: Client dashboard scope
- **WHEN** a client opens `/client/dashboard`
- **THEN** the content reflects only that client's ledger and engagements

#### Scenario: Client attempts unauthorized route
- **WHEN** a client tries to load `/admin/dashboard`
- **THEN** the middleware redirects to `/client/dashboard`
- **AND** no privileged data leaks
