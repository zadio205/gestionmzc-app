import { ClientLedger, SupplierLedger } from '@/types/accounting';
import { llmService } from './llmService';

/**
 * Adaptateur IA: enrichit les écritures importées avec une analyse IA locale/LLM.
 * - Utilise llmService.analyzeEntryDescription qui bascule automatiquement
 *   entre Ollama/HF/OpenAI et un fallback local.
 */
type AIAnnotation = {
  suspiciousLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  suggestions: string[];
};

// Générique: enrichit n'importe quelle écriture contenant debit/credit/description
export async function enrichEntriesAI<T extends { debit: number; credit: number; description: string }>(
  entries: T[]
): Promise<Array<T & { aiMeta: AIAnnotation }>> {
  const enriched: Array<T & { aiMeta: AIAnnotation }> = [];

  for (const entry of entries) {
    try {
      const amount = entry.debit > 0 ? entry.debit : entry.credit;
      const analysis = await llmService.analyzeEntryDescription(entry.description || '', amount || 0);
      enriched.push({ ...(entry as T), aiMeta: analysis });
    } catch (error) {
      // En cas d'erreur, laisser l'entrée telle quelle (sans aiMeta)
      // @ts-expect-error conserver le type T si l'analyse échoue
      enriched.push(entry);
    }
  }

  return enriched;
}

// Compat: fonction dédiée aux clients, utilise l'enrichissement générique
export async function enrichImportedClientLedger(entries: ClientLedger[]): Promise<ClientLedger[]> {
  try {
    return await enrichEntriesAI(entries);
  } catch {
    return entries;
  }
}

// Compat: fonction dédiée aux fournisseurs, utilise l'enrichissement générique
export async function enrichImportedSupplierLedger(entries: SupplierLedger[]): Promise<SupplierLedger[]> {
  try {
    return await enrichEntriesAI(entries);
  } catch {
    return entries;
  }
}
