## ADDED Requirements
### Requirement: Superadmin Shares Admin Routes
Superadmin users SHALL resolve dashboard and menu links under the `/admin` path structure so that every sidebar entry renders a valid page.

#### Scenario: Superadmin dashboard link
- **WHEN** a superadmin clicks "Tableau de bord"
- **THEN** the app navigates to `/admin/dashboard`
- **AND** the page responds with 200

#### Scenario: Superadmin clients link
- **WHEN** a superadmin clicks "Gestion des clients"
- **THEN** the app navigates to `/admin/clients`
- **AND** the page responds with 200

#### Scenario: Superadmin users link
- **WHEN** a superadmin clicks "Gestion des utilisateurs"
- **THEN** the app navigates to `/admin/users`
- **AND** the page responds with 200

#### Scenario: Superadmin GED link
- **WHEN** a superadmin clicks "GED"
- **THEN** the app navigates to `/admin/documents`
- **AND** the page responds with 200
