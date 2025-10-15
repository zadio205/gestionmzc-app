# Package Import Optimization

**Status**: Proposed  
**Component**: Dependencies  
**Priority**: High

## Overview

Optimize how third-party packages are imported to reduce bundle size through tree-shaking and selective imports.

## ADDED Requirements

### Requirement: Tree-Shakeable Imports
The system SHALL use import patterns that enable dead code elimination through tree-shaking.

#### Scenario: Specific function imports
- **WHEN** using utility libraries (lodash, date-fns)
- **THEN** import only specific functions needed
- **AND** avoid namespace imports (import *)
- **AND** verify tree-shaking in bundle

#### Scenario: Import validation
- **WHEN** code is committed
- **THEN** ESLint checks for non-optimized imports
- **AND** fail build on violations
- **AND** suggest correct import pattern

### Requirement: Package Size Auditing
The system SHALL monitor and limit third-party package sizes in the bundle.

#### Scenario: Heavy package detection
- **WHEN** dependency adds >50KB to bundle
- **THEN** flag for review in PR
- **AND** require justification or alternative
- **AND** document in dependency audit

#### Scenario: Duplicate dependency detection
- **WHEN** multiple versions of same package exist
- **THEN** report in bundle analysis
- **AND** consolidate to single version
- **AND** update package.json constraints

### Requirement: Dynamic Import for Heavy Libraries
The system SHALL lazy load large third-party libraries that aren't needed immediately.

#### Scenario: Chart library loading
- **WHEN** page contains charts
- **THEN** load chart library dynamically
- **AND** show skeleton during load
- **AND** render chart when library ready

#### Scenario: PDF generation
- **WHEN** user requests PDF export
- **THEN** load PDF library on-demand
- **AND** show progress indicator
- **AND** generate PDF when library loaded

## Problem Areas

### 1. Recharts (~450KB)

**Current** (likely):
```typescript
import { LineChart, BarChart, PieChart } from 'recharts';
```

**Issue**: Recharts is not fully tree-shakeable. Importing from the main package pulls in the entire library.

**Solution**:
```typescript
// ✅ Use specific imports if available
import LineChart from 'recharts/lib/chart/LineChart';
import Bar from 'recharts/lib/cartesian/Bar';

// Or use dynamic imports
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart));
```

**Better Alternative**: Consider `lightweight-charts` or `victory-native` for smaller bundle size.

### 2. date-fns (~200KB full, ~2-3KB per function)

**Current** (anti-pattern):
```typescript
import * as dateFns from 'date-fns';
```

**Solution**:
```typescript
// ✅ Import only what you need
import { format, parseISO, addDays } from 'date-fns';
```

### 3. Lodash (~70KB full, ~1-2KB per function)

**Current** (anti-pattern):
```typescript
import _ from 'lodash';
```

**Solution**:
```typescript
// ✅ Import from specific paths
import debounce from 'lodash/debounce';
import groupBy from 'lodash/groupBy';

// Or use lodash-es (ESM version)
import { debounce, groupBy } from 'lodash-es';
```

### 4. lucide-react (~600KB full, ~1KB per icon)

**Current** (should be okay):
```typescript
import { Users, Settings, Home } from 'lucide-react';
```

**Verify**: Check that imports are individual, not:
```typescript
import * as Icons from 'lucide-react'; // ❌ Bad
```

### 5. React Hook Form + Zod

**Current** (likely okay):
```typescript
import { useForm } from 'react-hook-form';
import { z } from 'zod';
```

These are already optimized packages.

## Import Optimization Strategy

### 1. Audit Current Imports

**Find problematic patterns**:
```bash
# Find namespace imports
rg "import \* as" --type ts

# Find default imports from large packages
rg "import .* from 'lodash'" --type ts
rg "import .* from 'date-fns'" --type ts
```

### 2. ESLint Rules

```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['lodash', '!lodash/*'],
              message: 'Import specific lodash functions: import debounce from "lodash/debounce"',
            },
            {
              group: ['date-fns', '!date-fns/*'],
              message: 'Import specific date-fns functions: import { format } from "date-fns"',
            },
            {
              group: ['**/lodash'],
              message: 'Use lodash-es for better tree-shaking',
            },
          ],
        },
      ],
    },
  },
];
```

### 3. Package Replacements

| Current Package | Size | Alternative | Size | Notes |
|----------------|------|-------------|------|-------|
| recharts | 450KB | lightweight-charts | 150KB | More limited API |
| lodash | 70KB | lodash-es + cherry-pick | 5-15KB | ESM version |
| moment | 300KB | date-fns | 20-50KB | Already using date-fns ✓ |
| uuid | 50KB | crypto.randomUUID() | 0KB | Native browser API |

### 4. Dynamic Import Strategy

**When to use dynamic imports**:
- Component used in <20% of page loads
- Heavy third-party library (>50KB)
- Below-fold content
- Modal/drawer content
- PDF generation
- Chart rendering

**Pattern**:
```typescript
// src/components/heavy/ChartComponent.tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(
  () => import('./HeavyChartImpl'),
  {
    loading: () => <Skeleton />,
    ssr: false,
  }
);
```

## Optimization Checklist

### Phase 1: Low-Hanging Fruit
- [ ] Audit all `import *` statements
- [ ] Convert lodash imports to individual functions
- [ ] Verify date-fns imports are specific
- [ ] Check icon imports are individual
- [ ] Remove unused dependencies

### Phase 2: Package Analysis
- [ ] Run bundle analyzer
- [ ] Identify packages >50KB
- [ ] Check for duplicate packages
- [ ] Find packages with <50% usage
- [ ] Document replacement candidates

### Phase 3: Replacements
- [ ] Replace heavy packages (if ROI is worth it)
- [ ] Update imports across codebase
- [ ] Test functionality thoroughly
- [ ] Measure bundle size improvement

## Testing Strategy

1. **Before/After Bundle Comparison**:
   ```bash
   npm run analyze > before.txt
   # Make changes
   npm run analyze > after.txt
   diff before.txt after.txt
   ```

2. **Import Validation**:
   - ESLint should catch bad patterns
   - Bundle analyzer shows actual bundled code
   - Test that functionality still works

3. **Runtime Testing**:
   - All features work as before
   - No console errors
   - Dynamic imports load correctly

## Monitoring

**Track in CI**:
- Bundle size per package
- Number of import violations
- Duplicate packages
- Unused dependencies

**Weekly Review**:
- New dependencies added
- Import patterns in PRs
- Bundle size trends

## Common Pitfalls

1. **Over-optimization**: Don't optimize packages <10KB unless heavily duplicated
2. **Breaking Tree-Shaking**: Some packages require specific import patterns
3. **TypeScript Issues**: Some packages have type issues with deep imports
4. **Side Effects**: Some packages have side effects that break with tree-shaking

## Migration Example

**Before** (`src/utils/formatters.ts`):
```typescript
import * as dateFns from 'date-fns';
import _ from 'lodash';

export function formatDate(date: Date) {
  return dateFns.format(date, 'PP');
}

export function groupByMonth(data: any[]) {
  return _.groupBy(data, item => dateFns.format(item.date, 'yyyy-MM'));
}
```

**After**:
```typescript
import { format } from 'date-fns';
import groupBy from 'lodash/groupBy';

export function formatDate(date: Date) {
  return format(date, 'PP');
}

export function groupByMonth(data: any[]) {
  return groupBy(data, item => format(item.date, 'yyyy-MM'));
}
```

**Savings**: ~200KB → ~5KB (40x smaller!)

## Documentation

Create `docs/import-guidelines.md`:
- Approved import patterns
- Banned patterns
- Package-specific guidance
- Examples

## References

- [Tree-shaking Guide](https://webpack.js.org/guides/tree-shaking/)
- [lodash-es vs lodash](https://github.com/lodash/lodash/wiki/Build-Differences)
- [Import Cost VSCode Extension](https://marketplace.visualstudio.com/items?itemName=wix.vscode-import-cost)
