# Bundle Analysis & Code Splitting

**Status**: Proposed  
**Component**: Build & Bundle  
**Priority**: High

## Overview

Define strategy for analyzing bundle composition and implementing code splitting to reduce initial page load sizes.

## ADDED Requirements

### Requirement: Bundle Analysis Tooling
The system SHALL provide bundle analysis capabilities to visualize and track JavaScript bundle composition.

#### Scenario: Generate bundle report
- **WHEN** developer runs bundle analysis
- **THEN** produce visual report showing all chunks and their sizes
- **AND** identify largest dependencies
- **AND** highlight optimization opportunities

#### Scenario: CI bundle tracking
- **WHEN** code is pushed to repository
- **THEN** automatically analyze bundle size changes
- **AND** comment on PR with size diff
- **AND** fail build if budget exceeded

### Requirement: Code Splitting Strategy
The system SHALL implement code splitting to load JavaScript on-demand rather than upfront.

#### Scenario: Route-based splitting
- **WHEN** user navigates to a route
- **THEN** load only that route's JavaScript
- **AND** shared code in separate chunk
- **AND** critical code prioritized

#### Scenario: Component lazy loading
- **WHEN** heavy component is needed
- **THEN** load dynamically when requested
- **AND** show loading state during fetch
- **AND** cache for subsequent uses

### Requirement: Modal Component Optimization
The system SHALL lazy load modal components to reduce initial bundle size.

#### Scenario: Modal on-demand loading
- **WHEN** user clicks to open modal
- **THEN** load modal component dynamically
- **AND** show loading indicator
- **AND** render modal when loaded

#### Scenario: Multiple modals optimization
- **WHEN** page has 10+ modal types
- **THEN** create map of lazy-loaded components
- **AND** load only opened modal
- **AND** keep loaded modals cached

### Requirement: Performance Budgets
The system SHALL enforce bundle size limits to prevent performance regression.

#### Scenario: Route bundle limit
- **WHEN** route bundle exceeds 100KB
- **THEN** fail CI build
- **AND** report which dependencies caused increase
- **AND** require optimization before merge

#### Scenario: Budget monitoring
- **WHEN** bundle size approaches limit (>90%)
- **THEN** warn in PR review
- **AND** suggest optimization strategies
- **AND** track trend over time

## Technical Specification

### 1. Bundle Analyzer Setup

```typescript
// next.config.ts
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer({
  // ... existing config
});
```

**Package**: `@next/bundle-analyzer`

**Scripts**:
```json
{
  "analyze": "ANALYZE=true npm run build",
  "analyze:server": "ANALYZE=true BUNDLE_ANALYZE=server npm run build",
  "analyze:browser": "ANALYZE=true BUNDLE_ANALYZE=browser npm run build"
}
```

### 2. Route-Based Code Splitting

Next.js automatically splits routes, but ensure proper structure:

```typescript
// src/app/admin/clients/page.tsx
// ✅ Good - Route automatically split
export default function ClientsPage() {
  return <ClientsList />;
}
```

### 3. Component-Level Code Splitting

**Dynamic Imports for Heavy Components**:

```typescript
// ❌ Before
import { ReportGenerator } from '@/components/reports/ReportGenerator';

// ✅ After
import dynamic from 'next/dynamic';

const ReportGenerator = dynamic(
  () => import('@/components/reports/ReportGenerator'),
  {
    loading: () => <ReportGeneratorSkeleton />,
    ssr: false, // If component doesn't need SSR
  }
);
```

**Use Cases for Dynamic Imports**:
- Modal components (26 files in `modal-pages/`)
- Charts and visualizations
- Report generators
- PDF viewers
- Rich text editors
- File uploaders

### 4. Modal Code Splitting Pattern

```typescript
// src/components/clients/ClientLedgerView.tsx
import dynamic from 'next/dynamic';
import { useState } from 'react';

// Lazy load all modal pages
const ModalPages = {
  balance: dynamic(() => import('./modal-pages/BalanceModal')),
  clients: dynamic(() => import('./modal-pages/ClientsModal')),
  suppliers: dynamic(() => import('./modal-pages/SuppliersModal')),
  // ... 23 more modals
};

export default function ClientLedgerView() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  const ActiveModalComponent = activeModal 
    ? ModalPages[activeModal as keyof typeof ModalPages]
    : null;

  return (
    <>
      {/* Buttons to open modals */}
      {ActiveModalComponent && <ActiveModalComponent />}
    </>
  );
}
```

### 5. Chart Lazy Loading

```typescript
// src/components/dashboard/MetricsChart.tsx
import dynamic from 'next/dynamic';

const Chart = dynamic(
  () => import('recharts').then(mod => ({
    default: mod.LineChart,
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Charts don't need SSR
  }
);
```

### 6. Intersection Observer for Below-Fold Content

```typescript
// src/hooks/useLazyLoad.ts
import { useEffect, useRef, useState } from 'react';

export function useLazyLoad() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// Usage
function Dashboard() {
  const { ref, isVisible } = useLazyLoad();

  return (
    <div>
      <TopContent />
      <div ref={ref}>
        {isVisible && <HeavyChartComponent />}
      </div>
    </div>
  );
}
```

## Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Initial bundle size | ~189KB | <100KB |
| Route chunks | 1 (all code) | 10+ (per route) |
| Modal load time | Immediate (always loaded) | <100ms on demand |
| Time to Interactive | Unknown | <2s on 3G |

## Analysis Metrics

**Track in Bundle Reports**:
- Total bundle size (client + server)
- Per-route bundle sizes
- Shared chunk sizes
- Top 20 heaviest packages
- Duplicate packages
- Unused code (tree-shaking opportunities)

## Implementation Priority

1. **Critical** (Week 1):
   - Install bundle analyzer
   - Generate baseline reports
   - Dynamic import for modals (biggest win)

2. **High** (Week 2):
   - Chart lazy loading
   - Report generator splitting
   - Below-fold lazy loading

3. **Medium** (Week 3):
   - Advanced splitting patterns
   - Prefetching optimization
   - Service worker caching

## Testing

- Load each route and verify code splitting
- Check Network tab for on-demand chunks
- Test modal opening performance
- Verify lazy-loaded content appears correctly
- Test with slow network throttling

## Monitoring

- Track bundle sizes in CI
- Alert on bundle size increases >10%
- Monitor Time to Interactive in production
- Track code splitting efficiency (chunks per route)

## References

- [Next.js Dynamic Imports](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Web.dev Code Splitting](https://web.dev/code-splitting-suspense/)
