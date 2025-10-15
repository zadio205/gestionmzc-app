## ADDED Requirements
### Requirement: Stable Role Authorization Feedback
Role-protected routes SHALL expose a distinct "authorizing" state while the user session and profile are being resolved, and SHALL delay showing any unauthorized fallback until the authorization state is definitively unauthorized.

#### Scenario: Authorization Pending
- **WHEN** the auth guard reports that authorization is in progress
- **THEN** the route SHALL render a neutral loading experience (spinner, skeleton, or layout-compatible placeholder)

#### Scenario: Authorized Session
- **WHEN** the auth guard confirms a signed-in user whose role matches the route requirements
- **THEN** the protected page content SHALL render without displaying the unauthorized fallback beforehand

#### Scenario: Unauthorized Session
- **WHEN** the auth guard determines there is no session or the role does not meet the route requirements
- **THEN** the route SHALL render the unauthorized fallback or redirect that state without showing protected content
