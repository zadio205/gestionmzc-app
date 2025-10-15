## 1. Implementation
- [ ] 1.1 Extend `useAuth` with an explicit authorization status that distinguishes loading, authorized, and unauthorized outcomes.
- [ ] 1.2 Create or update a reusable role guard component/hook that consumes the new status and renders loading, protected content, or unauthorized messaging accordingly.
- [ ] 1.3 Refactor role-protected routes (admin, collaborateur, client) to rely on the guard instead of inline `Accès non autorisé` fallbacks.
- [ ] 1.4 Manually verify each role dashboard no longer flashes the unauthorized state during initial load or navigation.
