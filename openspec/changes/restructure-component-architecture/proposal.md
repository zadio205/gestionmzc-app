# Restructure Component Architecture

**Status**: Proposed  
**Priority**: Medium  
**Created**: 2025-10-13  
**Updated**: 2025-10-13

## Problem Statement

The application has organizational and maintainability issues:

1. **Inconsistent Structure**: Components organized by role (admin/client/collaborateur) rather than features
2. **Deep Nesting**: 26+ modal files in `components/clients/modal-pages/` making navigation difficult
3. **No Design System**: UI components lack consistency and standardization
4. **Zero Test Coverage**: No tests to ensure reliability during refactoring
5. **Mixed Responsibilities**: Components handle multiple concerns (UI, logic, API calls)

### Impact

- **Developer Experience**: Hard to find components, understand structure
- **Code Duplication**: Similar components across different role folders
- **Maintenance Burden**: Changes require updates in multiple places
- **Quality Confidence**: No tests means fear of breaking things
- **Onboarding Time**: New developers struggle with organization

### Current Structure

```
src/
  components/
    admin/         # Admin-specific components
    clients/       # Client management (used by all roles?)
      modal-pages/ # 26+ modal components (too deep)
    dashboard/     # Dashboard widgets (shared?)
    layout/        # Layout components
    reports/       # Report components
    ui/            # 14 basic UI components
```

## Proposed Solution

Restructure around features and establish clear architectural patterns:

### 1. Feature-Based Organization

```
src/
  features/
    clients/
      components/  # Client-specific UI
      modals/      # Client modals (was modal-pages)
      hooks/       # Client data hooks
      api/         # Client API calls
      types/       # Client types
    ledger/
    reports/
    dashboard/
  shared/
    components/    # Shared UI components
    hooks/         # Shared hooks
    utils/         # Shared utilities
  design-system/
    primitives/    # Button, Input, Card, etc.
    patterns/      # Common patterns
    tokens/        # Design tokens
```

### 2. Design System

Create consistent, documented component library:
- Standardized components (Button, Input, Modal, etc.)
- Design tokens (colors, spacing, typography)
- Storybook documentation
- Accessibility standards

### 3. Testing Infrastructure

Establish comprehensive testing strategy:
- Unit tests for utilities and hooks
- Component tests with Testing Library
- Integration tests for features
- E2E tests for critical flows

### 4. Clear Separation of Concerns

```typescript
// ❌ Before: Everything in one component
function ClientList() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setData);
  }, []);
  return <div>{/* render */}</div>;
}

// ✅ After: Separated concerns
// hooks/useClients.ts
export function useClients() {
  return useQuery(['clients'], fetchClients);
}

// components/ClientList.tsx
export function ClientList() {
  const { data } = useClients();
  return <ClientListView data={data} />;
}
```

## Success Criteria

- [ ] Feature-based folder structure implemented
- [ ] Design system with 20+ documented components
- [ ] 80% test coverage on new code
- [ ] Migration guide for existing code
- [ ] Reduced code duplication by 40%
- [ ] Component library in Storybook

## Technical Approach

### Phase 1: Foundation (Days 1-3)

1. Create new folder structure
2. Set up testing infrastructure (Jest, Testing Library)
3. Establish design system foundation
4. Create component migration guide

### Phase 2: Design System (Days 4-7)

1. Build primitive components (Button, Input, Card, etc.)
2. Create design tokens
3. Set up Storybook
4. Document components
5. Add accessibility tests

### Phase 3: Feature Migration (Days 8-14)

1. Migrate client management features
2. Migrate ledger features
3. Migrate dashboard features
4. Update imports throughout codebase
5. Remove old component locations

### Phase 4: Testing & Documentation (Days 15-16)

1. Add tests for migrated components
2. Integration tests for features
3. Update developer documentation
4. Create architectural decision records (ADRs)

## Dependencies

- Should complete after security improvements (stable logging)
- Can proceed in parallel with performance optimization
- Requires team buy-in for structure changes

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing code | Critical | Gradual migration, keep old imports working |
| Team resistance to change | Medium | Clear documentation, training sessions |
| Incomplete migration | Medium | Phase approach, track progress |
| Test writing time | Low | Parallel test writing with migration |

## Migration Strategy

### Gradual Migration Approach

1. **Create new structure alongside old**
2. **Migrate components one feature at a time**
3. **Maintain backward-compatible imports**
4. **Update imports incrementally**
5. **Remove old structure when 100% migrated**

### Example Migration

```typescript
// Step 1: Create new component
// src/features/clients/components/ClientCard.tsx
export function ClientCard() { /* ... */ }

// Step 2: Add re-export in old location (temporary)
// src/components/clients/ClientCard.tsx
export { ClientCard } from '@/features/clients/components/ClientCard';

// Step 3: Update imports gradually
// Old: import { ClientCard } from '@/components/clients/ClientCard';
// New: import { ClientCard } from '@/features/clients';

// Step 4: Remove old re-export when all imports updated
```

## Testing Strategy

### Unit Tests
- All utility functions
- Custom hooks
- Business logic

### Component Tests
- Rendering with different props
- User interactions
- Error states

### Integration Tests
- Feature workflows
- API integration
- State management

### E2E Tests
- Critical user journeys
- Cross-role functionality
- Happy paths

## Documentation

- Architecture decision records (ADRs)
- Component library documentation (Storybook)
- Feature module guides
- Testing guidelines
- Migration playbook

## Related Changes

- `improve-security-code-quality` - Clean code foundation
- `optimize-bundle-performance` - Better code splitting by feature
- `modernize-architecture` - Broader modernization effort

## References

- [Feature-Sliced Design](https://feature-sliced.design/)
- [React Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Storybook Component Documentation](https://storybook.js.org/)
- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/)
