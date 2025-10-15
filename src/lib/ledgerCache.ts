/**
 * Cache pour les données de ledger
 */
import type { LedgerEntry } from '@/types/ledger';

// Cache en mémoire pour les entrées de ledger
const ledgerCache = new Map<string, LedgerEntry[]>();

/**
 * Récupère les entrées de ledger depuis le cache
 */
export function getLedgerCache(clientId: string): LedgerEntry[] {
  return ledgerCache.get(clientId) || [];
}

/**
 * Stocke les entrées de ledger dans le cache
 */
export function setLedgerCache(clientId: string, entries: LedgerEntry[]): void {
  ledgerCache.set(clientId, entries);
}

/**
 * Nettoie le cache pour un client
 */
export function clearLedgerCache(clientId: string): void {
  ledgerCache.delete(clientId);
}

/**
 * Simule la récupération des entrées depuis l'API
 */
export async function listClientLedger(clientId: string): Promise<{ entries: LedgerEntry[] }> {
  try {
    const response = await fetch(`/api/client-ledger?clientId=${clientId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { entries: data.entries || [] };
  } catch (error) {
    console.error('Error fetching client ledger:', error);
    return { entries: [] };
  }
}

/**
 * Sauvegarde les entrées de ledger
 */
export async function saveClientLedger(entries: LedgerEntry[]): Promise<{ success: boolean; entries: LedgerEntry[] }> {
  try {
    const response = await fetch('/api/client-ledger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ entries })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, entries: data.entries || entries };
  } catch (error) {
    console.error('Error saving client ledger:', error);
    return { success: false, entries };
  }
}

/**
 * Supprime les entrées de ledger pour un client
 */
export async function clearClientLedger(clientId: string): Promise<void> {
  try {
    const response = await fetch(`/api/client-ledger?clientId=${clientId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error clearing client ledger:', error);
    throw error;
  }
}