# Testing Infrastructure

**Status**: Proposed  
**Component**: Quality Assurance  
**Priority**: High

## Overview

Establish comprehensive testing infrastructure to ensure code quality, prevent regressions, and enable confident refactoring.

## ADDED Requirements

### Requirement: Test Coverage
The system SHALL maintain minimum 80% code coverage for all new code.

#### Scenario: Coverage enforcement
- **WHEN** code is committed
- **THEN** run coverage analysis
- **AND** fail CI if below threshold
- **AND** report coverage to developer
- **AND** track coverage trends over time

#### Scenario: Coverage reporting
- **WHEN** coverage report generated
- **THEN** show line, branch, function coverage
- **AND** highlight untested code paths
- **AND** integrate with CI/CD
- **AND** display in PRs

### Requirement: Unit Testing
The system SHALL provide unit tests for utilities, hooks, and business logic.

#### Scenario: Utility function tests
- **WHEN** utility function exists
- **THEN** test all input scenarios
- **AND** test edge cases and errors
- **AND** test type safety
- **AND** achieve 100% coverage

#### Scenario: Custom hook tests
- **WHEN** custom hook exists
- **THEN** test with React Testing Library hooks
- **AND** test loading, success, error states
- **AND** test state updates and side effects
- **AND** mock external dependencies

### Requirement: Component Testing
The system SHALL provide component tests focusing on user interactions and behavior.

#### Scenario: Component rendering
- **WHEN** component renders
- **THEN** test with different prop combinations
- **AND** test conditional rendering
- **AND** test loading and error states
- **AND** verify accessibility

#### Scenario: User interactions
- **WHEN** user interacts with component
- **THEN** test click, input, navigation events
- **AND** verify state changes
- **AND** verify callbacks invoked
- **AND** test keyboard navigation

### Requirement: Integration Testing
The system SHALL provide integration tests for feature workflows and API integration.

#### Scenario: Feature workflow
- **WHEN** user completes feature workflow
- **THEN** test end-to-end flow
- **AND** verify data persistence
- **AND** test error scenarios
- **AND** verify UI updates

#### Scenario: API integration
- **WHEN** component calls API
- **THEN** mock API responses
- **AND** test success scenarios
- **AND** test error handling
- **AND** verify loading states

### Requirement: E2E Testing
The system SHALL provide end-to-end tests for critical user journeys.

#### Scenario: Critical path testing
- **WHEN** critical feature used
- **THEN** test in real browser
- **AND** test across user roles
- **AND** verify data accuracy
- **AND** test error recovery

#### Scenario: Cross-browser testing
- **WHEN** E2E tests run
- **THEN** test in Chrome, Firefox, Safari
- **AND** test on mobile viewports
- **AND** verify responsive behavior
- **AND** test accessibility

## Testing Stack

### Unit & Component Tests
- **Jest**: Test runner
- **Testing Library**: Component testing
- **MSW**: API mocking
- **jest-dom**: DOM matchers

### Integration Tests
- **Testing Library**: Feature testing
- **MSW**: API mocking
- **React Query**: Data fetching

### E2E Tests
- **Playwright**: Browser automation
- **Real browser testing**: Chrome, Firefox, Safari

## Test Structure

```
src/
  features/
    clients/
      components/
        ClientList.test.tsx
        ClientCard.test.tsx
      hooks/
        useClients.test.ts
      __tests__/
        clients.integration.test.tsx
  
  shared/
    utils/
      formatters.test.ts
      validators.test.ts
    hooks/
      useAuth.test.ts
  
  design-system/
    primitives/
      Button/
        Button.test.tsx
        Button.stories.tsx

tests/
  e2e/
    client-management.spec.ts
    ledger-workflow.spec.ts
  integration/
    dashboard.test.tsx
  setup/
    jest.setup.ts
    test-utils.tsx
```

## Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/__tests__/**',
  ],
};
```

## Test Utilities

```typescript
// tests/setup/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
```

## Example Tests

### Unit Test (Utility)

```typescript
// src/shared/utils/formatters.test.ts
import { formatCurrency, formatDate } from './formatters';

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('€1,234.56');
  });

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-€1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('€0.00');
  });
});
```

### Component Test

```typescript
// src/features/clients/components/ClientCard.test.tsx
import { renderWithProviders, screen } from '@/tests/setup/test-utils';
import { ClientCard } from './ClientCard';

describe('ClientCard', () => {
  const mockClient = {
    id: '1',
    name: 'Test Client',
    email: 'test@example.com',
  };

  it('renders client information', () => {
    renderWithProviders(<ClientCard client={mockClient} />);
    
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', async () => {
    const onEdit = jest.fn();
    renderWithProviders(
      <ClientCard client={mockClient} onEdit={onEdit} />
    );
    
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(onEdit).toHaveBeenCalledWith(mockClient.id);
  });
});
```

### Hook Test

```typescript
// src/features/clients/hooks/useClients.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useClients } from './useClients';

const server = setupServer(
  rest.get('/api/clients', (req, res, ctx) => {
    return res(ctx.json([{ id: '1', name: 'Test Client' }]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useClients', () => {
  it('fetches clients successfully', async () => {
    const { result } = renderHook(() => useClients());
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].name).toBe('Test Client');
  });

  it('handles errors', async () => {
    server.use(
      rest.get('/api/clients', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    
    const { result } = renderHook(() => useClients());
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
```

### Integration Test

```typescript
// src/features/clients/__tests__/clients.integration.test.tsx
import { renderWithProviders, screen, waitFor } from '@/tests/setup/test-utils';
import userEvent from '@testing-library/user-event';
import { ClientManagement } from '../ClientManagement';

describe('Client Management Integration', () => {
  it('completes full client workflow', async () => {
    renderWithProviders(<ClientManagement />);
    
    // List loads
    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument();
    });
    
    // Open edit modal
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    // Edit client
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Client');
    
    // Save
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify update
    await waitFor(() => {
      expect(screen.getByText('Updated Client')).toBeInTheDocument();
    });
  });
});
```

## CI Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm ci
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Unit test speed | <10ms per test |
| Component test speed | <100ms per test |
| Integration test speed | <1s per test |
| E2E test speed | <30s per test |
| Total test suite | <5 minutes |

## Best Practices

1. **Test Behavior, Not Implementation**
2. **Use Meaningful Test Names**
3. **Arrange-Act-Assert Pattern**
4. **Mock External Dependencies**
5. **Test Error Cases**
6. **Keep Tests Independent**
7. **Use Test Data Builders**
8. **Prioritize Critical Paths**

## Documentation

- Testing guide
- Writing tests tutorial
- Mocking strategies
- CI/CD integration guide

## References

- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
