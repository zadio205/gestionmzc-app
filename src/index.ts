/**
 * Point d'entrée principal pour les exports de l'application
 * Centralise tous les imports pour faciliter la maintenance
 */

// Types principaux
export * from './types/index';
export * from './types/auth';
export * from './types/accounting';
export type { AnalysisResult, JustificationRequest, LedgerFilters, LedgerSummary, EntryStatus, LedgerEntry } from './types/ledger';

// Services optimisés
export { dashboardService } from './services/dashboardService';
export { optimizedBalanceService } from './services/optimizedBalanceService';

// Repositories
export { BaseRepository } from './repositories/BaseRepository';
export { clientLedgerRepository } from './repositories/ClientLedgerRepository';

// Système de cache unifié
export * from './lib/cache';

// Composants principaux
export * from './components/ledgers';
export * from './components/ui';

// Hooks optimisés
export { useDashboardData } from './hooks/useDashboardData';

// Utils essentiels
export * from './utils/formatters';
export * from './utils/inputValidation';
export * from './utils/csvSanitizer';

// Configuration Supabase
export { supabaseServer } from './lib/supabase';