# Design: UI Contrast and Visibility Improvements

## Current Issues Identified

### 1. Black Screen Problems
- **Mobile overlay**: `bg-black/50` in DashboardLayout.tsx may persist
- **Modal backdrops**: Multiple components use `bg-black bg-opacity-50` without proper cleanup
- **Loading states**: Missing loading indicators during authentication transitions

### 2. Text Contrast Issues
- **Gray text on light backgrounds**: `text-gray-400`, `text-gray-500` on `bg-gray-50` backgrounds
- **Invisible text in headers**: `text-gray-600` on white backgrounds
- **Button text**: Poor contrast in disabled states
- **Form labels**: `text-gray-700` may be too light for some users

### 3. Loading State Problems
- **Authentication**: Pages show blank during `useAuth()` loading
- **Data fetching**: No skeleton states for dashboard content
- **Navigation**: Missing loading indicators during route transitions

## Design Solutions

### 1. Color System Improvements
```css
/* Enhanced contrast colors */
--color-text-primary: #111827;    /* gray-900 */
--color-text-secondary: #374151;  /* gray-700 */
--color-text-tertiary: #6b7280;   /* gray-500 */
--color-text-inverse: #ffffff;    /* white */
--color-bg-primary: #ffffff;      /* white */
--color-bg-secondary: #f9fafb;    /* gray-50 */
--color-bg-tertiary: #f3f4f6;     /* gray-100 */
```

### 2. Loading State Strategy
- **Authentication**: Show branded loading screen with logo
- **Data fetching**: Use skeleton components with subtle animations
- **Navigation**: Progress bar for route transitions
- **Modals**: Backdrop with blur effect instead of solid black

### 3. Contrast Standards
- **Normal text**: Minimum 4.5:1 contrast ratio (WCAG AA)
- **Large text**: Minimum 3:1 contrast ratio
- **Interactive elements**: Enhanced focus states
- **Disabled states**: Maintain visibility while indicating disabled status

### 4. Component-Specific Fixes

#### Authentication Pages
- Replace blank states with branded loading screen
- Improve form field contrast
- Add error state visibility

#### Dashboard Layout
- Fix mobile overlay cleanup
- Improve sidebar text contrast
- Add loading states for data

#### Modals and Overlays
- Use backdrop blur with subtle opacity
- Ensure proper z-index management
- Add escape key handling

#### Tables and Lists
- Enhance header contrast
- Improve row hover states
- Fix text visibility in actions

## Implementation Approach

### Phase 1: Critical Fixes
1. Fix authentication loading states
2. Resolve black overlay issues
3. Improve primary navigation contrast

### Phase 2: Systematic Improvements
1. Update color system variables
2. Enhance form contrast
3. Improve table readability

### Phase 3: Polish and Enhancement
1. Add skeleton loading states
2. Enhance micro-interactions
3. Improve accessibility features

## Testing Strategy
- **Contrast validation**: Use automated tools to verify WCAG compliance
- **User testing**: Verify loading states are clear and informative
- **Cross-browser testing**: Ensure consistency across browsers
- **Mobile testing**: Verify touch targets and contrast on mobile devices