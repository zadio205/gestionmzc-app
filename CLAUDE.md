# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands for Development

### Setup & Installation
```bash
npm install                    # Install dependencies
cp .env.local.example .env.local  # Configure environment variables
```

### Development Server
```bash
npm run dev                    # Start development server (http://localhost:3000)
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run ESLint
```

### Database Setup
```bash
# Execute SQL scripts in order for Supabase setup:
scripts/create-profiles-table.sql
scripts/create-ledger-comments-table.sql
scripts/create-misc-ledger-table.sql
scripts/create-supplier-ledger-table.sql
scripts/create-balance-cache-tables.sql
scripts/create-ledgers-cache-tables.sql
scripts/create-justificatifs-table.sql
scripts/create-justificatifs-rls.sql
scripts/create-storage-policies.sql
```

### Testing & Validation
```bash
node scripts/check-balance-tables.js              # Verify balance cache tables
node scripts/check-rls-policies.js                # Check RLS policies
node scripts/test-balance-persistence.js          # Test balance persistence
```

## Architecture Overview

### Role-Based Multi-Tenant System
- **superadmin**: Manages admins, full system access
- **admin**: Manages their own collaborators and clients
- **collaborateur**: Works on client files assigned to their admin
- **client**: Accesses only their own data

The system uses a hierarchical relationship where `admin_id` in the profiles table creates the multi-tenant structure.

### Key Architectural Patterns

#### Authentication & Middleware
- `middleware.ts` handles route protection based on user roles
- Uses Supabase Auth with custom profile extensions
- Caches user profiles (5-minute TTL) for performance
- Routes automatically redirect based on role hierarchy

#### Data Access Layer
- **Services**: Business logic layer (`clientLedgerService.ts`, `balanceApi.ts`, etc.)
- **Libraries**: Database connection and caching (`supabase.ts`, various cache files)
- **Hooks**: React hooks for state management (`useClientLedger.ts`, `useBalancePersistence.ts`)

#### Caching Strategy
- **Balance Cache**: Multi-layer caching with local fallback and Supabase persistence
- **Ledger Cache**: Client/supplier ledger caching for performance
- **Cache Migration**: Automated migration scripts for cache structure changes

#### Route Structure
```
/superadmin/*    - Only superadmin
/admin/*         - Superadmin + admin
/collaborateur/* - Superadmin + admin + collaborateur
/client/*        - Clients only
```

### Database Schema
- **profiles**: Extended user data with roles and hierarchy
- **client_ledger**: Client accounting entries
- **supplier_ledger**: Supplier accounting entries
- **misc_ledger**: Miscellaneous ledger entries
- **balance_cache*: Cached balance calculations
- **justificatifs**: Document management
- **ledger_comments**: Comment system for entries

### Key Components Architecture

#### Client Management System
- Modal-based interface for client data viewing/editing
- Real-time analysis of ledger entries
- Justification request system
- Export/share functionality

#### Dashboard System
- Role-specific dashboards with different widgets
- Real-time activity feeds
- Predictive analytics and smart notifications
- Task management integration

#### Document Management (GED)
- File upload with validation and sanitization
- Role-based access control through RLS policies
- Storage policies for secure document access

### State Management Patterns
- Custom hooks for complex state (ledger data, balance persistence)
- Context for simple global state (notifications)
- Local storage fallbacks for critical data
- Real-time updates through WebSocket integration

### Performance Optimizations
- Memoization in ledger analysis services
- Pagination and virtual scrolling for large datasets
- Background processing for cache calculations
- Lazy loading of heavy components

### Error Handling
- Comprehensive error boundaries for different sections
- Graceful degradation when services are unavailable
- Automatic retry mechanisms with exponential backoff
- User-friendly error messages with recovery options

### Development Notes
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Tailwind CSS for styling with custom component library
- Component composition over inheritance patterns
- Service layer abstraction for API calls

### Important Business Logic
- Client ledger analysis detects unpaid invoices, missing justifications, and suspicious entries
- Balance calculations use cached data with automatic refresh
- Role inheritance follows hierarchy (higher roles can access lower role data)
- Document permissions are enforced at database level through RLS