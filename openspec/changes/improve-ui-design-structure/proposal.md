## Why
The current application suffers from inconsistent design patterns, poor responsive behavior, accessibility gaps, and outdated UI components. Pages display different styling approaches, mobile experience is fragmented, and there's no cohesive design system. This creates usability issues and undermines the professional appearance expected from an accounting firm management platform.

## What Changes
- Implement a consistent design system with unified spacing, typography, and color schemes
- Fix responsive layout issues across all role-specific dashboards and pages
- Improve accessibility with proper ARIA labels, keyboard navigation, and semantic HTML
- Standardize component patterns and eliminate design inconsistencies
- Enhance mobile navigation and touch interactions
- Add loading states, error boundaries, and micro-interactions
- Implement proper dark mode support and theme consistency

## Impact
- Affected specs: ui-design, responsive-design, accessibility
- Affected code: All page components under `src/app/**`, layout components in `src/components/layout`, UI components in `src/components/ui`, global styles in `src/app/globals.css`
- Dependencies: Coordinate with existing `refactor-role-page-structure` to ensure design improvements align with routing changes