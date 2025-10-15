# Tasks: Restructure Component Architecture

**Total**: 25 tasks  
**Completed**: 0  
**In Progress**: 0  
**Remaining**: 25

---

## Phase 1: Foundation (7 tasks)

### Task 1.1: Create New Folder Structure
- [ ] Create `src/features/` directory
- [ ] Create `src/shared/` directory
- [ ] Create `src/design-system/` directory
- [ ] Create subdirectories for each feature module
- [ ] Document new structure in README

**Files**:
- Create directory structure
- Update `docs/architecture.md`

**Estimated**: 30 minutes

---

### Task 1.2: Set Up Testing Infrastructure
- [ ] Install Jest and Testing Library
- [ ] Configure Jest for Next.js
- [ ] Set up test utilities and helpers
- [ ] Create example tests
- [ ] Add test scripts to package.json

**Files**:
- `jest.config.js`
- `jest.setup.js`
- Create `src/test-utils/`
- `package.json`

**Estimated**: 2 hours

---

### Task 1.3: Configure Test Coverage
- [ ] Set up coverage thresholds (80%)
- [ ] Add coverage reporting
- [ ] Configure coverage ignore patterns
- [ ] Add CI coverage checks

**Files**:
- `jest.config.js`
- `.github/workflows/test.yml`

**Estimated**: 1 hour

---

### Task 1.4: Set Up Storybook
- [ ] Install Storybook
- [ ] Configure for Next.js App Router
- [ ] Set up Tailwind in Storybook
- [ ] Create example stories
- [ ] Add Storybook scripts

**Files**:
- `.storybook/main.js`
- `.storybook/preview.js`
- `package.json`

**Estimated**: 1.5 hours

---

### Task 1.5: Create Design Tokens
- [ ] Define color palette
- [ ] Define spacing scale
- [ ] Define typography scale
- [ ] Define shadow/elevation
- [ ] Export as CSS variables and TypeScript

**Files**:
- Create `src/design-system/tokens/colors.ts`
- Create `src/design-system/tokens/spacing.ts`
- Create `src/design-system/tokens/typography.ts`
- Create `src/design-system/tokens/index.ts`

**Estimated**: 2 hours

---

### Task 1.6: Create Component Migration Guide
- [ ] Document migration steps
- [ ] Create migration checklist
- [ ] Document import path changes
- [ ] Create ADR for architecture change

**Files**:
- Create `docs/migration-guide.md`
- Create `docs/adr/001-feature-based-architecture.md`

**Estimated**: 1 hour

---

### Task 1.7: Set Up Path Aliases
- [ ] Update tsconfig.json with new paths
- [ ] Add aliases for features, shared, design-system
- [ ] Test import resolution
- [ ] Update documentation

**Files**:
- `tsconfig.json`

**Estimated**: 30 minutes

---

## Phase 2: Design System (8 tasks)

### Task 2.1: Build Primitive Button Component
- [ ] Create Button component with variants
- [ ] Add loading and disabled states
- [ ] Write unit tests
- [ ] Create Storybook story
- [ ] Document props and usage

**Files**:
- `src/design-system/primitives/Button/Button.tsx`
- `src/design-system/primitives/Button/Button.test.tsx`
- `src/design-system/primitives/Button/Button.stories.tsx`

**Estimated**: 2 hours

---

### Task 2.2: Build Input Components
- [ ] Create Input component
- [ ] Create Select component
- [ ] Create Textarea component
- [ ] Add validation states (error, success)
- [ ] Write tests and stories

**Files**:
- `src/design-system/primitives/Input/`
- `src/design-system/primitives/Select/`
- `src/design-system/primitives/Textarea/`

**Estimated**: 3 hours

---

### Task 2.3: Build Card Component
- [ ] Create Card with variants
- [ ] Add CardHeader, CardBody, CardFooter
- [ ] Write tests and stories
- [ ] Document composition patterns

**Files**:
- `src/design-system/primitives/Card/`

**Estimated**: 1.5 hours

---

### Task 2.4: Build Modal Component
- [ ] Create accessible Modal component
- [ ] Add animations and transitions
- [ ] Handle focus trapping
- [ ] Write tests and stories
- [ ] Add keyboard navigation

**Files**:
- `src/design-system/primitives/Modal/`

**Estimated**: 3 hours

---

### Task 2.5: Build Table Component
- [ ] Create Table with sorting
- [ ] Add pagination support
- [ ] Add loading states
- [ ] Write tests and stories
- [ ] Add accessibility features

**Files**:
- `src/design-system/primitives/Table/`

**Estimated**: 3 hours

---

### Task 2.6: Build Form Components
- [ ] Create Form wrapper
- [ ] Create FormField with label and error
- [ ] Integrate with react-hook-form
- [ ] Write tests and stories

**Files**:
- `src/design-system/patterns/Form/`

**Estimated**: 2 hours

---

### Task 2.7: Build Loading Components
- [ ] Create Spinner component
- [ ] Create Skeleton component
- [ ] Create LoadingOverlay
- [ ] Write tests and stories

**Files**:
- `src/design-system/primitives/Loading/`

**Estimated**: 1.5 hours

---

### Task 2.8: Build Feedback Components
- [ ] Create Toast/Notification
- [ ] Create Alert component
- [ ] Create Badge component
- [ ] Write tests and stories

**Files**:
- `src/design-system/primitives/Toast/`
- `src/design-system/primitives/Alert/`
- `src/design-system/primitives/Badge/`

**Estimated**: 2 hours

---

## Phase 3: Feature Migration (7 tasks)

### Task 3.1: Migrate Client Management Feature
- [ ] Create `src/features/clients/` structure
- [ ] Move client components
- [ ] Reorganize 26 modal files into `modals/`
- [ ] Extract client hooks
- [ ] Update imports

**Files**:
- Create `src/features/clients/`
- Move from `src/components/clients/`
- Update all imports

**Estimated**: 4 hours

---

### Task 3.2: Migrate Ledger Feature
- [ ] Create `src/features/ledger/` structure
- [ ] Move ledger components
- [ ] Extract ledger hooks and logic
- [ ] Update imports

**Files**:
- Create `src/features/ledger/`
- Move ledger-related components
- Update imports

**Estimated**: 3 hours

---

### Task 3.3: Migrate Dashboard Feature
- [ ] Create `src/features/dashboard/` structure
- [ ] Move dashboard components
- [ ] Extract dashboard data hooks
- [ ] Update imports

**Files**:
- Create `src/features/dashboard/`
- Move from `src/components/dashboard/`
- Update imports

**Estimated**: 2 hours

---

### Task 3.4: Migrate Reports Feature
- [ ] Create `src/features/reports/` structure
- [ ] Move report components
- [ ] Extract report logic
- [ ] Update imports

**Files**:
- Create `src/features/reports/`
- Move from `src/components/reports/`
- Update imports

**Estimated**: 2 hours

---

### Task 3.5: Create Shared Module
- [ ] Move shared components to `src/shared/components/`
- [ ] Move shared hooks to `src/shared/hooks/`
- [ ] Move shared utilities to `src/shared/utils/`
- [ ] Update all imports

**Files**:
- Create `src/shared/`
- Move shared code
- Update imports

**Estimated**: 3 hours

---

### Task 3.6: Update UI Components
- [ ] Migrate `src/components/ui/` to design system or shared
- [ ] Identify which to keep, which to replace
- [ ] Update to use design tokens
- [ ] Update imports

**Files**:
- `src/components/ui/` → `src/design-system/` or `src/shared/`
- Update all imports

**Estimated**: 2 hours

---

### Task 3.7: Remove Old Component Locations
- [ ] Verify all imports updated
- [ ] Remove `src/components/admin/`
- [ ] Remove `src/components/clients/`
- [ ] Remove `src/components/dashboard/`
- [ ] Remove old folder structure

**Files**:
- Delete old directories

**Estimated**: 1 hour

---

## Phase 4: Testing & Documentation (3 tasks)

### Task 4.1: Write Component Tests
- [ ] Test all migrated feature components
- [ ] Test design system components
- [ ] Test shared components
- [ ] Achieve 80% coverage

**Files**:
- `*.test.tsx` files throughout codebase

**Estimated**: 8 hours

---

### Task 4.2: Write Integration Tests
- [ ] Test client management flow
- [ ] Test ledger workflows
- [ ] Test dashboard data loading
- [ ] Test report generation

**Files**:
- Create `tests/integration/`

**Estimated**: 4 hours

---

### Task 4.3: Update Documentation
- [ ] Document new architecture
- [ ] Update component library docs
- [ ] Create feature module guides
- [ ] Update developer onboarding

**Files**:
- `docs/architecture.md`
- `docs/component-library.md`
- `docs/feature-modules.md`
- `README.md`

**Estimated**: 3 hours

---

## Summary

- **Phase 1**: 8.5 hours (Foundation)
- **Phase 2**: 18 hours (Design System)
- **Phase 3**: 17 hours (Migration)
- **Phase 4**: 15 hours (Testing & Docs)

**Total Estimated Time**: ~58.5 hours (~7-8 days)

## Dependencies

- Testing infrastructure needed before writing tests
- Design system foundation needed before component migration
- Feature migration should happen one at a time
- Documentation should be updated as migration progresses

## Notes

- This is a large refactoring effort that should be done carefully
- Consider doing migration in smaller PRs by feature
- Keep old imports working during transition period
- Communicate changes clearly to team
- Update migration guide as issues are discovered
