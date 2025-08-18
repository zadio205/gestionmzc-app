/**
 * Exemple d'utilisation du nouveau système de cache de balance basé sur Supabase
 * 
 * Cet exemple montre comment utiliser les nouvelles fonctions asynchrones
 * pour gérer le cache de balance avec Supabase
 */

import { 
  getBalanceLocalCache, 
  setBalanceLocalCache, 
  clearBalanceLocalCache,
  getLastUsedPeriod,
  setLastUsedPeriod 
} from '@/lib/balanceLocalCache';

import type { BalanceItem } from '@/types/accounting';

// Exemple d'utilisation dans un composant React
export const useBalanceCache = (clientId: string) => {
  const [balance, setBalance] = useState<BalanceItem[]>([]);
  const [period, setPeriod] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Charger la dernière période utilisée
  useEffect(() => {
    const loadLastPeriod = async () => {
      try {
        const lastPeriod = await getLastUsedPeriod(clientId);
        if (lastPeriod) {
          setPeriod(lastPeriod);
        }
      } catch (error) {
        console.warn('Erreur lors du chargement de la dernière période:', error);
      }
    };
    
    loadLastPeriod();
  }, [clientId]);

  // Charger les données de balance
  const loadBalance = async (targetPeriod?: string) => {
    setLoading(true);
    try {
      const periodToUse = targetPeriod || period;
      const cachedData = await getBalanceLocalCache(clientId, periodToUse);
      
      if (cachedData) {
        setBalance(cachedData);
        // Sauvegarder la période utilisée
        await setLastUsedPeriod(clientId, periodToUse);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la balance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les données de balance
  const saveBalance = async (data: BalanceItem[], targetPeriod?: string) => {
    try {
      const periodToUse = targetPeriod || period;
      await setBalanceLocalCache(clientId, periodToUse, data);
      await setLastUsedPeriod(clientId, periodToUse);
      setBalance(data);
      
      console.log(`Balance sauvegardée pour le client ${clientId}, période ${periodToUse}`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la balance:', error);
    }
  };

  // Effacer les données de balance
  const clearBalance = async (targetPeriod?: string) => {
    try {
      const periodToUse = targetPeriod || period;
      await clearBalanceLocalCache(clientId, periodToUse);
      setBalance([]);
      
      console.log(`Balance effacée pour le client ${clientId}, période ${periodToUse}`);
    } catch (error) {
      console.error('Erreur lors de l\'effacement de la balance:', error);
    }
  };

  return {
    balance,
    period,
    loading,
    setPeriod,
    loadBalance,
    saveBalance,
    clearBalance,
  };
};

// Exemple d'utilisation dans un gestionnaire d'import
export const handleBalanceImport = async (
  clientId: string,
  period: string,
  importedData: BalanceItem[]
) => {
  try {
    // Sauvegarder les données importées
    await setBalanceLocalCache(clientId, period, importedData);
    
    // Marquer cette période comme dernière utilisée
    await setLastUsedPeriod(clientId, period);
    
    console.log(`Import réussi: ${importedData.length} éléments sauvegardés`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    return false;
  }
};

// Exemple de fonction utilitaire pour vérifier la présence de données
export const checkBalanceExists = async (
  clientId: string, 
  period: string
): Promise<boolean> => {
  try {
    const data = await getBalanceLocalCache(clientId, period);
    return data ? data.length > 0 : false;
  } catch (error) {
    console.warn('Erreur lors de la vérification des données:', error);
    return false;
  }
};
