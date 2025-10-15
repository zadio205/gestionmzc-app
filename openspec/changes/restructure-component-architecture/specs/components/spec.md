# Component Organization

**Status**: Proposed  
**Component**: Architecture  
**Priority**: High

## Overview

Define feature-based component organization to improve maintainability, reduce duplication, and enable better code splitting.

## ADDED Requirements

### Requirement: Feature-Based Organization
The system SHALL organize components by feature rather than by role or component type.

#### Scenario: Client feature module
- **WHEN** working with client-related code
- **THEN** all client components, hooks, and types in one module
- **AND** feature is self-contained
- **AND** dependencies clearly defined

#### Scenario: Feature isolation
- **WHEN** features are developed
- **THEN** each feature module is independent
- **AND** shared code in separate module
- **AND** circular dependencies prevented

### Requirement: Component Hierarchy
The system SHALL establish clear component hierarchy from primitives to features.

#### Scenario: Component layers
- **WHEN** building UI
- **THEN** use design system primitives (Button, Input)
- **AND** compose into patterns (Form, DataTable)
- **AND** build feature components from patterns
- **AND** avoid direct DOM element usage

#### Scenario: Component composition
- **WHEN** creating complex components
- **THEN** compose from smaller components
- **AND** use design system patterns
- **AND** maintain single responsibility

### Requirement: Separation of Concerns
The system SHALL separate UI components from business logic and data fetching.

#### Scenario: Presentational components
- **WHEN** component renders UI
- **THEN** receive data via props
- **AND** emit events via callbacks
- **AND** contain no business logic
- **AND** easily testable in isolation

#### Scenario: Data fetching hooks
- **WHEN** component needs data
- **THEN** use custom hook for fetching
- **AND** hook handles loading/error states
- **AND** component focuses on presentation
- **AND** hook reusable across components

### Requirement: Modal Organization
The system SHALL organize modal components for efficient code splitting and lazy loading.

#### Scenario: Modal registry
- **WHEN** application has multiple modals
- **THEN** create modal registry for lazy loading
- **AND** load modal only when opened
- **AND** unload when closed
- **AND** reduce initial bundle size

#### Scenario: Modal composition
- **WHEN** creating modal content
- **THEN** use design system Modal primitive
- **AND** compose content from feature components
- **AND** handle modal state consistently
- **AND** ensure accessibility

## Current Structure Issues

**Problems**:
1. Role-based organization makes features fragmented
2. 26+ modal files in single directory (hard to navigate)
3. Duplicate components across role folders
4. Mixed UI and logic in same files
5. Unclear component dependencies

**Example of Poor Organization**:
```
src/components/
  admin/
    ClientList.tsx      # Admin's client list
  collaborateur/
    ClientList.tsx      # Collaborateur's client list (duplicate?)
  clients/
    modal-pages/
      ClientBalanceModal.tsx
      ClientDetailsModal.tsx
      ... (24 more modals)
```

## Target Structure

```
src/
  features/
    clients/
      components/          # Client UI components
        ClientList.tsx
        ClientCard.tsx
      modals/             # Client modals (was modal-pages)
        ClientBalanceModal.tsx
        ClientDetailsModal.tsx
      hooks/              # Client data hooks
        useClients.ts
        useClientBalance.ts
      api/                # Client API calls
        clientApi.ts
      types/              # Client types
        client.types.ts
      index.ts            # Public exports
    
    ledger/
      components/
      hooks/
      api/
      types/
      index.ts
    
    reports/
      components/
      hooks/
      api/
      types/
      index.ts
  
  shared/
    components/           # Shared across features
      Layout.tsx
      Navigation.tsx
    hooks/                # Shared hooks
      useAuth.ts
      usePermissions.ts
    utils/                # Shared utilities
      formatters.ts
      validators.ts
  
  design-system/
    primitives/           # Base components
      Button/
      Input/
      Modal/
    patterns/             # Composed patterns
      Form/
      DataTable/
    tokens/               # Design tokens
      colors.ts
      spacing.ts
```

## Component Patterns

### 1. Feature Module Structure

```typescript
// src/features/clients/index.ts
export { ClientList } from './components/ClientList';
export { useClients } from './hooks/useClients';
export type { Client } from './types/client.types';
```

### 2. Separation Pattern

```typescript
// ❌ Before: Everything mixed
function ClientList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    fetch('/api/clients')
      .then(r => r.json())
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);
  
  return (
    <div>
      {loading ? <div>Loading...</div> : (
        <table>
          {clients.map(client => (
            <tr key={client.id}>
              <td>{client.name}</td>
            </tr>
          ))}
        </table>
      )}
    </div>
  );
}

// ✅ After: Separated concerns

// hooks/useClients.ts
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });
}

// components/ClientList.tsx
export function ClientList() {
  const { data: clients, isLoading } = useClients();
  
  if (isLoading) return <Skeleton />;
  
  return <ClientListView clients={clients} />;
}

// components/ClientListView.tsx (pure presentation)
export function ClientListView({ clients }: Props) {
  return (
    <Table>
      {clients.map(client => (
        <TableRow key={client.id}>
          <TableCell>{client.name}</TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
```

### 3. Modal Registry Pattern

```typescript
// features/clients/modals/index.ts
import { lazy } from 'react';

export const clientModals = {
  balance: lazy(() => import('./ClientBalanceModal')),
  details: lazy(() => import('./ClientDetailsModal')),
  edit: lazy(() => import('./ClientEditModal')),
  // ... 23 more modals
} as const;

// Usage
import { clientModals } from '@/features/clients/modals';

function ClientPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  const ModalComponent = activeModal 
    ? clientModals[activeModal as keyof typeof clientModals]
    : null;
  
  return (
    <>
      <Button onClick={() => setActiveModal('balance')}>
        Show Balance
      </Button>
      
      <Suspense fallback={<ModalSkeleton />}>
        {ModalComponent && (
          <ModalComponent onClose={() => setActiveModal(null)} />
        )}
      </Suspense>
    </>
  );
}
```

### 4. Design System Usage

```typescript
// ❌ Before: Direct DOM elements
<div className="rounded bg-white shadow p-4">
  <button className="bg-blue-500 text-white px-4 py-2 rounded">
    Click Me
  </button>
</div>

// ✅ After: Design system components
import { Card, Button } from '@/design-system';

<Card>
  <Button variant="primary">Click Me</Button>
</Card>
```

## Migration Path

### Phase 1: Create Structure (Day 1)
- Set up new folder structure
- Create index files for exports
- Document organization rules

### Phase 2: Migrate by Feature (Days 2-5)
- Migrate one feature at a time
- Keep old imports working (re-export)
- Update imports gradually
- Remove old location when done

### Phase 3: Cleanup (Day 6)
- Remove all old imports
- Delete old folders
- Update documentation

## Import Path Examples

```typescript
// Old (role-based)
import { ClientList } from '@/components/admin/ClientList';
import { ClientCard } from '@/components/clients/ClientCard';

// New (feature-based)
import { ClientList, ClientCard } from '@/features/clients';

// Design system
import { Button, Input, Card } from '@/design-system';

// Shared
import { useAuth, usePermissions } from '@/shared/hooks';
```

## Benefits

1. **Better Code Splitting**: Features naturally split into chunks
2. **Reduced Duplication**: Shared code explicitly shared
3. **Easier Navigation**: Related code co-located
4. **Clear Dependencies**: Feature boundaries enforce clean architecture
5. **Better Testing**: Self-contained features easier to test
6. **Improved Onboarding**: Clear structure for new developers

## Testing Strategy

- Test feature modules in isolation
- Test component composition
- Test modal lazy loading
- Verify no circular dependencies

## Documentation

- Architecture decision record (ADR)
- Feature module template
- Component creation guide
- Migration checklist

## References

- [Feature-Sliced Design](https://feature-sliced.design/)
- [React Folder Structure](https://www.robinwieruch.de/react-folder-structure/)
- [Component Composition](https://reactjs.org/docs/composition-vs-inheritance.html)
