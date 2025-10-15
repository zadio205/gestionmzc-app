# Tasks: Optimize Bundle Performance

**Total**: 20 tasks  
**Completed**: 0  
**In Progress**: 0  
**Remaining**: 20

---

## Phase 1: Analysis & Setup (5 tasks)

### Task 1.1: Install Bundle Analyzer
- [ ] Install `@next/bundle-analyzer` package
- [ ] Configure analyzer in `next.config.ts`
- [ ] Add npm scripts for bundle analysis
- [ ] Test analyzer on current build

**Files**:
- `package.json`
- `next.config.ts`

**Estimated**: 30 minutes

---

### Task 1.2: Generate Bundle Reports
- [ ] Run analyzer for all routes (admin, client, collaborateur, superadmin)
- [ ] Document bundle sizes per route
- [ ] Identify top 10 largest dependencies
- [ ] Create baseline metrics document

**Files**:
- Create `docs/bundle-analysis-baseline.md`

**Estimated**: 1 hour

---

### Task 1.3: Audit Dependencies
- [ ] Run `npm ls --depth=0` to list direct dependencies
- [ ] Identify duplicate packages
- [ ] Find heavy packages (>50KB)
- [ ] Research lighter alternatives

**Files**:
- Create `docs/dependency-audit.md`

**Estimated**: 2 hours

---

### Task 1.4: Set Performance Budgets
- [ ] Define bundle size targets per route (<100KB)
- [ ] Configure Next.js performance budgets
- [ ] Add bundle size check to CI
- [ ] Document budget rationale

**Files**:
- `next.config.ts`
- Create `.github/workflows/bundle-size.yml`

**Estimated**: 1 hour

---

### Task 1.5: Install Performance Monitoring
- [ ] Add Lighthouse CI configuration
- [ ] Set up Core Web Vitals tracking
- [ ] Configure performance thresholds
- [ ] Test monitoring pipeline

**Files**:
- Create `.lighthouserc.json`
- `.github/workflows/performance.yml`

**Estimated**: 1.5 hours

---

## Phase 2: Quick Wins (5 tasks)

### Task 2.1: Optimize Recharts Imports
- [ ] Find all Recharts imports
- [ ] Convert to tree-shakeable imports
- [ ] Test chart functionality
- [ ] Measure bundle impact

**Files**:
- `src/components/dashboard/MetricsChart.tsx`
- `src/components/dashboard/QuickStats.tsx`
- Any other chart components

**Estimated**: 1 hour

---

### Task 2.2: Optimize date-fns Imports
- [ ] Find all date-fns imports
- [ ] Convert to individual function imports
- [ ] Test date formatting
- [ ] Measure bundle impact

**Files**:
- Search codebase for `from 'date-fns'`

**Estimated**: 45 minutes

---

### Task 2.3: Optimize Icon Imports
- [ ] Find all `lucide-react` imports
- [ ] Ensure individual icon imports (not `*`)
- [ ] Remove unused icons
- [ ] Measure bundle impact

**Files**:
- All component files using icons

**Estimated**: 1 hour

---

### Task 2.4: Add Dynamic Import for Modals
- [ ] Identify modal components (26 files in `components/clients/modal-pages/`)
- [ ] Convert to `next/dynamic` imports
- [ ] Add loading states
- [ ] Test modal opening/closing

**Files**:
- `src/components/clients/modal-pages/*`
- Parent components using modals

**Estimated**: 2 hours

---

### Task 2.5: Optimize Next.js Config
- [ ] Enable SWC minification
- [ ] Configure output file tracing
- [ ] Enable modern JavaScript target
- [ ] Add compression settings

**Files**:
- `next.config.ts`

**Estimated**: 30 minutes

---

## Phase 3: Deep Optimization (7 tasks)

### Task 3.1: Implement Route-Based Code Splitting
- [ ] Analyze route dependencies
- [ ] Split shared vs route-specific code
- [ ] Move route-specific code to route folders
- [ ] Test all routes load correctly

**Files**:
- All route files in `src/app/*`

**Estimated**: 3 hours

---

### Task 3.2: Lazy Load Dashboard Charts
- [ ] Convert charts to dynamic imports
- [ ] Add loading skeletons
- [ ] Implement intersection observer for below-fold charts
- [ ] Test dashboard performance

**Files**:
- `src/components/dashboard/MetricsChart.tsx`
- `src/components/dashboard/QuickStats.tsx`
- `src/components/dashboard/StatCard.tsx`

**Estimated**: 2 hours

---

### Task 3.3: Optimize Report Generator
- [ ] Lazy load report generation components
- [ ] Split PDF generation libraries
- [ ] Add dynamic imports for heavy dependencies
- [ ] Test report generation

**Files**:
- `src/components/reports/ReportGenerator.tsx`
- `src/services/reportService.ts`

**Estimated**: 2 hours

---

### Task 3.4: Implement Image Optimization
- [ ] Convert all `<img>` to Next.js `<Image>`
- [ ] Add responsive image sizes
- [ ] Configure image optimization in next.config
- [ ] Add lazy loading for below-fold images

**Files**:
- All components with images
- `next.config.ts`

**Estimated**: 2.5 hours

---

### Task 3.5: Optimize Client Ledger Components
- [ ] Split ledger modal pages into chunks
- [ ] Lazy load analysis panels
- [ ] Implement virtualization for large tables
- [ ] Test ledger performance

**Files**:
- `src/components/clients/modal-pages/*` (26 files)
- `src/components/clients/AnalysisPanel.tsx`

**Estimated**: 3 hours

---

### Task 3.6: Evaluate Package Replacements
- [ ] Research alternatives for heavy packages
- [ ] Create migration plan for safe replacements
- [ ] Test alternatives in isolation
- [ ] Document findings

**Files**:
- Create `docs/package-replacements.md`

**Estimated**: 2 hours

---

### Task 3.7: Implement Progressive Loading
- [ ] Add service worker for caching
- [ ] Implement prefetching for likely navigation
- [ ] Add skeleton screens for all routes
- [ ] Test offline capabilities

**Files**:
- Create `public/sw.js`
- `src/app/layout.tsx`
- All route components

**Estimated**: 3 hours

---

## Phase 4: Monitoring & Enforcement (3 tasks)

### Task 4.1: Set Up CI Bundle Checks
- [ ] Create GitHub Action for bundle size
- [ ] Set thresholds for failures
- [ ] Add PR comments with bundle diff
- [ ] Test CI pipeline

**Files**:
- `.github/workflows/bundle-size.yml`

**Estimated**: 1.5 hours

---

### Task 4.2: Create Performance Dashboard
- [ ] Set up real-user monitoring (RUM)
- [ ] Create dashboard for Core Web Vitals
- [ ] Add alerting for regressions
- [ ] Document dashboard access

**Files**:
- Configure monitoring service (e.g., Vercel Analytics)
- Create `docs/performance-monitoring.md`

**Estimated**: 2 hours

---

### Task 4.3: Document Optimization Guidelines
- [ ] Create performance best practices doc
- [ ] Document code splitting patterns
- [ ] Add import optimization guidelines
- [ ] Create performance checklist for PRs

**Files**:
- Create `docs/performance-guidelines.md`
- Update `.github/PULL_REQUEST_TEMPLATE.md`

**Estimated**: 1.5 hours

---

## Summary

- **Phase 1**: 6 hours (Analysis)
- **Phase 2**: 5.25 hours (Quick Wins)
- **Phase 3**: 17.5 hours (Deep Optimization)
- **Phase 4**: 5 hours (Monitoring)

**Total Estimated Time**: ~34 hours (~4-5 days)

## Dependencies

- Security improvements should be done first (logging infrastructure)
- Some tasks may overlap with architecture restructuring
- Bundle analyzer is prerequisite for most optimization tasks
