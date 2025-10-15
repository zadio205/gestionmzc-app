# Loading States and Black Screen Fixes

## ADDED Requirements

### Requirement: Authentication Loading Screen
When a user navigates to any protected page and the authentication state is loading, instead of showing a blank or black screen, the system SHALL display a branded loading screen with the company logo and a loading indicator.

#### Scenario:
User navigates to `/admin/dashboard` while authentication is still loading. Instead of a blank screen, they see the Masyzarac logo with a loading spinner and "Chargement en cours..." text on a light background.

#### Acceptance Criteria:
- Shows Masyzarac logo during authentication loading
- Displays a subtle loading spinner
- Uses a light background with good contrast
- Maintains user engagement during loading
- Disappears smoothly when authentication completes

### Requirement: Route Transition Loading
When navigating between different sections of the application, a progress indicator SHALL show at the top of the page to indicate that content is loading, preventing the perception of a broken or frozen interface.

#### Scenario:
User clicks from `/admin/clients` to `/admin/reports`. A blue progress bar appears at the top of the page, animating from 0% to 100% as the new page loads, then disappears smoothly.

#### Acceptance Criteria:
- Progress bar appears at the top during route changes
- Smooth animation from 0 to 100%
- Automatically disappears when content loads
- Non-intrusive design that doesn't block content
- Consistent behavior across all routes

### Requirement: Data Loading Skeletons
When dashboard data is loading, skeleton components SHALL be displayed to show the expected layout and maintain visual continuity, preventing empty or black screens.

#### Scenario:
User visits `/collaborateur/dashboard` and the statistics cards show gray placeholder shapes that match the final layout, with subtle shimmer animations until the real data loads.

#### Acceptance Criteria:
- Skeleton shapes match the actual content layout
- Subtle animation to indicate loading state
- Maintains page structure and spacing
- Replaced smoothly with actual content
- Applied to all dashboard widgets and tables

## MODIFIED Requirements

### Requirement: Modal Backdrop Cleanup
When modals are closed, the backdrop overlay MUST be properly removed without leaving black overlays that obscure the main content.

#### Scenario:
User opens a client details modal, then closes it. The black backdrop fades out smoothly without leaving any residual overlay that would block interaction with the main page content.

#### Acceptance Criteria:
- Backdrop fades out smoothly when modal closes
- No residual overlay remains after modal dismissal
- Proper z-index management prevents layer conflicts
- Escape key properly closes modal and removes backdrop
- Click outside modal closes and cleans up correctly

### Requirement: Mobile Menu Overlay
On mobile devices, when the sidebar menu is open, the overlay MUST properly close when the menu is dismissed or when switching to desktop view.

#### Scenario:
User opens the mobile sidebar menu, then rotates their device to landscape orientation. The overlay automatically closes as the screen width changes to desktop size.

#### Acceptance Criteria:
- Overlay appears only on mobile devices
- Automatically closes when switching to desktop
- Proper cleanup when menu is closed
- Touch-friendly close behavior
- No overlay persistence issues

## REMOVED Requirements

### Requirement: Static Loading Pages
Remove static loading pages that show blank screens with no user feedback during data fetching operations.

#### Scenario:
Previously, when loading client data, users would see blank white screens. Now, all loading states show visual feedback like skeletons or spinners.

#### Acceptance Criteria:
- No more blank white/black screens during loading
- All loading states have visual feedback
- Users always know the system is working
- Loading time is perceived as shorter with visual feedback