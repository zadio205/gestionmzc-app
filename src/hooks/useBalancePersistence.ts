import { useState, useEffect, useCallback } from 'react';
import type { BalanceItem } from '@/types/accounting';
import { 
  getLastUsedPeriod, 
  setLastUsedPeriod 
} from '@/lib/balanceRealCache';
import { listBalance, saveBalance, clearBalance, type BalanceInput } from '@/services/balanceApi';

interface UseBalancePersistenceOptions {
  clientId: string;
  period: string;
  onNotification?: (notification: {
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    duration?: number;
  }) => void;
}

export function useBalancePersistence({ 
  clientId, 
  period, 
  onNotification 
}: UseBalancePersistenceOptions) {
  const [items, setItems] = useState<BalanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Fonction de chargement des données
  const loadData = useCallback(async (force = false) => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      console.log(`🔄 Chargement des données pour client ${clientId}, période ${period}${force ? ' (forcé)' : ''}`);
      
      // Chargement via API serveur (inclut fallback cache mémoire côté serveur)
      const { items: apiItems } = await listBalance(clientId, period);
      if (apiItems && apiItems.length > 0) {
        console.log(`📦 Données trouvées: ${apiItems.length} éléments`);
        setItems(apiItems);
        setLastSyncTime(new Date());
      } else {
        console.log('Aucune donnée trouvée');
        setItems([]);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      onNotification?.({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les données.',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, period, onNotification]);

  // Fonction de sauvegarde des données
  const saveData = useCallback(async (newItems: BalanceItem[]) => {
    try {
      console.log('💾 Sauvegarde de', newItems.length, 'éléments...');
      
      // 1) Mise à jour immédiate de l'état
      setItems(newItems);
      
      // 2) Sauvegarde via API serveur
      const payload: BalanceInput[] = newItems.map(i => ({
        accountNumber: i.accountNumber,
        accountName: i.accountName,
        debit: i.debit,
        credit: i.credit,
        balance: i.balance,
        clientId: clientId,
        period: period,
        importIndex: i.importIndex,
  originalDebit: i.originalDebit,
  originalCredit: i.originalCredit,
        createdAt: i.createdAt,
      }));
      await saveBalance(payload);
      await setLastUsedPeriod(clientId, period);
      
      setLastSyncTime(new Date());
      
      onNotification?.({
        type: 'success',
        title: 'Sauvegarde réussie',
        message: `${newItems.length} élément${newItems.length > 1 ? 's' : ''} sauvegardé${newItems.length > 1 ? 's' : ''}.`,
        duration: 3000,
      });
      
    } catch (error: any) {
      console.error('❌ Erreur de sauvegarde:', error);
      onNotification?.({
        type: 'error',
        title: 'Erreur de sauvegarde',
        message: error?.message || 'Impossible de sauvegarder les données.',
        duration: 5000,
      });
    }
  }, [clientId, period, onNotification]);

  // Fonction de suppression des données
  const clearData = useCallback(async () => {
    try {
      console.log('🗑️ Suppression des données...');
      
      // 1) Suppression immédiate de l'état
      setItems([]);
      
  // 2) Suppression via API serveur
  await clearBalance(clientId, period);
      
      onNotification?.({
        type: 'success',
        title: 'Données supprimées',
        message: 'Toutes les données de la balance ont été supprimées.',
        duration: 3000,
      });
      
    } catch (error: any) {
      console.error('❌ Erreur de suppression:', error);
      onNotification?.({
        type: 'error',
        title: 'Erreur de suppression',
        message: error?.message || 'Impossible de supprimer les données.',
        duration: 5000,
      });
    }
  }, [clientId, period, onNotification]);

  // Chargement initial et rechargement sur changement de client/période
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Rechargement quand la page redevient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && items.length > 0) {
        console.log('🔄 Page visible, vérification des données...');
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadData, items.length]);

  // Synchronisation périodique (toutes les 5 minutes si des données existent)
  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      console.log('⏰ Synchronisation périodique...');
      loadData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loadData, items.length]);

  return {
    items,
    loading,
    lastSyncTime,
    saveData,
    clearData,
    reloadData: () => loadData(true),
  };
}
