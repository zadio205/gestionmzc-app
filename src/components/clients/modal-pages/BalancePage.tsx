"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, BarChart3, PieChart } from "lucide-react";
import { BalanceItem, BalanceIndicator } from "@/types/accounting";
import FileImporter from "@/components/ui/FileImporter";
import { useNotification } from "@/contexts/NotificationContextSimple";
import { listBalance, saveBalance, clearBalance } from "@/services/balanceApi";
import { getBalanceLocalCache, setBalanceLocalCache, clearBalanceLocalCache, getLastUsedPeriod, setLastUsedPeriod } from "@/lib/balanceLocalCache";

interface BalancePageProps {
  clientId: string;
}

const BalancePage: React.FC<BalancePageProps> = ({ clientId }) => {
  const [activeSubPage, setActiveSubPage] = useState<"balance" | "indicators">(
    "balance"
  );
  const [importedItems, setImportedItems] = useState<BalanceItem[]>([]);
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<string>("2024-01");

  // Au montage, essayer de restaurer la dernière période utilisée pour ce client
  useEffect(() => {
    (async () => {
      try {
        const last = await getLastUsedPeriod(clientId);
        if (last) setPeriod(last);
      } catch (error) {
        console.warn('Erreur lors de la récupération de la dernière période:', error);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Fermer les états internes si le parent se ferme
  useEffect(() => {
    const closeAll = () => {
      setActiveSubPage("balance");
      // Pas de reset des données importées - on garde les données
    };
    window.addEventListener('close-all-modals', closeAll as any);
    return () => window.removeEventListener('close-all-modals', closeAll as any);
  }, []);

  // Charger la balance persistée au montage
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // 1) Essayer cache Supabase (évite flicker et couvre le offline)
        const local = await getBalanceLocalCache(clientId, period);
        if (mounted && local && local.length > 0) {
          setImportedItems(local);
        }
        // 2) Puis interroger l'API (écrase avec la source serveur si dispo)
        const { items } = await listBalance(clientId, period);
        if (!mounted) return;
        const safeItems = items || [];
        setImportedItems(safeItems);
        await setBalanceLocalCache(clientId, period, safeItems);
        // Persister la période utilisée si on a des données
        if (safeItems.length > 0) await setLastUsedPeriod(clientId, period);
      } catch (e) {
        // fallback: si pas de base, garder uniquement le cache Supabase
        const localOnly = await getBalanceLocalCache(clientId, period);
        if (mounted && localOnly) setImportedItems(localOnly);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [clientId, period]);

  // Debug useEffect pour surveiller les changements d'état
  useEffect(() => {
    console.log("🔄 État importedItems changé:", importedItems);
    console.log("🔄 Nombre d'éléments importés:", importedItems.length);
  }, [importedItems]);

  // Calculer les indicateurs à partir des données importées
  const calculateIndicators = (): BalanceIndicator => {
    if (importedItems.length === 0) {
      return {
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        netResult: 0,
        workingCapital: 0,
        currentRatio: 0,
        debtRatio: 0,
        profitMargin: 0,
      };
    }

    // Classification des comptes selon le plan comptable français
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenues = 0;
    let totalExpenses = 0;
    let currentAssets = 0;
    let currentLiabilities = 0;

    importedItems.forEach((item) => {
      const accountNum = item.accountNumber || "";
      const balance = item.balance || 0;

      // Classe 1 : Comptes de capitaux (Capitaux propres et dettes à long terme)
      if (accountNum.startsWith("1")) {
        if (
          accountNum.startsWith("10") ||
          accountNum.startsWith("11") ||
          accountNum.startsWith("12")
        ) {
          // Capitaux propres (10x, 11x, 12x)
          totalEquity += Math.abs(balance);
        } else {
          // Dettes à long terme (13x, 14x, 15x, 16x, 17x, 18x)
          totalLiabilities += Math.abs(balance);
        }
      }
      // Classe 2 : Immobilisations (Actif immobilisé)
      else if (accountNum.startsWith("2")) {
        totalAssets += Math.abs(balance);
      }
      // Classe 3 : Stocks (Actif circulant)
      else if (accountNum.startsWith("3")) {
        totalAssets += Math.abs(balance);
        currentAssets += Math.abs(balance);
      }
      // Classe 4 : Comptes de tiers
      else if (accountNum.startsWith("4")) {
        if (
          accountNum.startsWith("40") ||
          accountNum.startsWith("42") ||
          accountNum.startsWith("43") ||
          accountNum.startsWith("44")
        ) {
          // Dettes fournisseurs et autres dettes (Passif circulant)
          totalLiabilities += Math.abs(balance);
          currentLiabilities += Math.abs(balance);
        } else {
          // Créances clients et autres créances (Actif circulant)
          totalAssets += Math.abs(balance);
          currentAssets += Math.abs(balance);
        }
      }
      // Classe 5 : Comptes financiers (Actif circulant)
      else if (accountNum.startsWith("5")) {
        totalAssets += Math.abs(balance);
        currentAssets += Math.abs(balance);
      }
      // Classe 6 : Comptes de charges
      else if (accountNum.startsWith("6")) {
        totalExpenses += Math.abs(balance);
      }
      // Classe 7 : Comptes de produits
      else if (accountNum.startsWith("7")) {
        totalRevenues += Math.abs(balance);
      }
    });

    const netResult = totalRevenues - totalExpenses;
    const workingCapital = currentAssets - currentLiabilities;
    const currentRatio =
      currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const totalAssetsFinal = totalAssets;
    const debtRatio =
      totalAssetsFinal > 0 ? totalLiabilities / totalAssetsFinal : 0;
    const profitMargin =
      totalRevenues > 0 ? (netResult / totalRevenues) * 100 : 0;

    return {
      totalAssets: totalAssetsFinal,
      totalLiabilities,
      totalEquity,
      netResult,
      workingCapital,
      currentRatio,
      debtRatio,
      profitMargin,
    };
  };

  const indicators = calculateIndicators();

  // Fonction pour convertir les valeurs en nombre (gestion décimaux français)
  const toNumber = (value: any): number => {
    if (!value) return 0;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      if (value.trim() === "") return 0;
      // Remplacer les virgules par des points pour les nombres français
      const cleanValue = value.replace(/\s/g, "").replace(/,/g, ".");
      const num = parseFloat(cleanValue);
      return isNaN(num) ? 0 : num;
    }
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  };

  // Addition sécurisée
  const addNumbers = (a: any, b: any): number => {
    return toNumber(a) + toNumber(b);
  };

  // Soustraction sécurisée
  const subtractNumbers = (a: any, b: any): number => {
    return toNumber(a) - toNumber(b);
  };

  // Formatage des montants en euros
  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(toNumber(amount));
  };

  const handleImport = async (data: any[]) => {
    console.log("🚀 DEBUT IMPORT - Données reçues:", data);
    console.log("🚀 Type des données:", typeof data);
    console.log("🚀 Nombre de lignes:", data.length);

    // Debug détaillé des premières lignes
    data.slice(0, 3).forEach((row, i) => {
      console.log(`🔍 LIGNE ${i} - Structure complète:`, row);
      console.log(`🔍 LIGNE ${i} - Type:`, typeof row);
      console.log(`🔍 LIGNE ${i} - Clés:`, Object.keys(row));
      console.log(`🔍 LIGNE ${i} - Valeurs:`, Object.values(row));
    });

    if (!data || data.length === 0) {
      console.log("⚠️ Aucune donnée à importer");
      return;
    }

    const newItems: BalanceItem[] = data.map((row: any, index: number) => {
      console.log(`\n=== TRAITEMENT LIGNE ${index + 1} ===`);
      console.log("Données brutes:", row);

      // FORCER LA RECHERCHE DU POINT-VIRGULE DANS TOUS LES CAS
      let columns: string[] = [];
      let rawText = "";

      console.log("Type de row:", typeof row);
      console.log("Est-ce un array?", Array.isArray(row));
      console.log("A-t-il .data?", !!row.data);

      // D'abord, extraire le texte brut pour chercher des point-virgules
      if (typeof row === "string") {
        rawText = row;
      } else if (Array.isArray(row)) {
        // Vérifier si le premier élément contient des point-virgules
        if (row.length > 0 && String(row[0]).includes(";")) {
          rawText = String(row[0]);
          console.log("🔍 Point-virgule trouvé dans array[0]:", rawText);
        } else if (row.length >= 4) {
          // Array déjà bien séparé
          columns = row.slice(0, 4).map((item) => String(item || ""));
          while (columns.length < 4) columns.push("");
          console.log("✅ Array déjà séparé ->", columns);
        } else {
          // Array mal séparé, joindre et chercher des ;
          rawText = row.join(" ");
        }
      } else if (row.data && typeof row.data === "object") {
        const values = Object.values(row.data);
        // Vérifier si la première valeur contient des point-virgules
        if (values.length > 0 && String(values[0]).includes(";")) {
          rawText = String(values[0]);
          console.log("🔍 Point-virgule trouvé dans .data[0]:", rawText);
        } else if (values.length >= 4) {
          // Objet déjà bien séparé
          columns = values.slice(0, 4).map((item) => String(item || ""));
          while (columns.length < 4) columns.push("");
          console.log("✅ Objet .data déjà séparé ->", columns);
        } else {
          // Objet mal séparé, joindre et chercher des ;
          rawText = values.join(" ");
        }
      } else {
        const keys = Object.keys(row).filter((k) => k !== "index");
        const values = keys.map((k) => row[k]);
        if (values.length > 0 && String(values[0]).includes(";")) {
          rawText = String(values[0]);
          console.log("🔍 Point-virgule trouvé dans objet[0]:", rawText);
        } else if (values.length >= 4) {
          columns = values.slice(0, 4).map((item) => String(item || ""));
          while (columns.length < 4) columns.push("");
          console.log("✅ Objet direct déjà séparé ->", columns);
        } else {
          rawText = values.join(" ");
        }
      }

      // Si on a du texte brut, chercher des point-virgules
      if (rawText && columns.length === 0) {
        console.log("🔍 Recherche de ; dans:", rawText);
        if (rawText.includes(";")) {
          columns = rawText.split(";");
          console.log("✅ SÉPARÉ PAR ; ->", columns);
        } else {
          console.log("⚠️ Pas de ; trouvé, tout dans libellé");
          columns = ["", rawText, "", ""];
        }
      }

      // S'assurer qu'on a 4 colonnes
      while (columns.length < 4) {
        columns.push("");
      }

      // Assurer qu'on a au moins 4 colonnes
      while (columns.length < 4) {
        columns.push("");
      }

      // Nettoyer MINIMALEMENT (seulement BOM et espaces début/fin)
      const cleanText = (text: string): string => {
        if (!text) return "";
        return String(text)
          .replace(/^\uFEFF/, "") // Supprimer seulement BOM
          .trim(); // Supprimer seulement espaces début/fin
      };

      const accountNumber = cleanText(columns[0]);
      const accountName = cleanText(columns[1]);
      const debitStr = cleanText(columns[2]);
      const creditStr = cleanText(columns[3]);

      console.log("RÉSULTAT FINAL:", {
        accountNumber,
        accountName,
        debitStr,
        creditStr,
      });

      // Utiliser les nouvelles fonctions de conversion
      const debitNum = toNumber(debitStr);
      const creditNum = toNumber(creditStr);

      console.log(`✅ Ligne ${index + 1} - Montants convertis:`, {
        debitOriginal: debitStr,
        creditOriginal: creditStr,
        debitNum,
        creditNum,
      });

      console.log(`🔍 VÉRIFICATION DÉCIMAUX - Ligne ${index + 1}:`, {
        "debitStr brut": `"${debitStr}"`,
        "creditStr brut": `"${creditStr}"`,
        "longueur debitStr": debitStr.length,
        "longueur creditStr": creditStr.length,
      });

      const finalItem = {
        _id: `imported-${Date.now()}-${index}`,
        accountNumber: accountNumber,
        accountName: accountName,
        debit: debitNum,
        credit: creditNum,
        balance: subtractNumbers(debitNum, creditNum),
        clientId,
        period: period,
        createdAt: new Date(),
        importIndex: index,
        originalDebit: debitStr,
        originalCredit: creditStr,
      };

      console.log(`🔍 OBJET FINAL - Ligne ${index + 1}:`, {
        originalDebit: finalItem.originalDebit,
        originalCredit: finalItem.originalCredit,
        typeDebit: typeof finalItem.originalDebit,
        typeCredit: typeof finalItem.originalCredit,
      });

      return finalItem;
    });

    console.log("🎉 Éléments traités finaux:", newItems);
    console.log("🎉 Nombre d'éléments à ajouter:", newItems.length);

  setImportedItems(newItems);
  // Mettre à jour cache Supabase immédiatement
  (async () => {
    try {
      await setBalanceLocalCache(clientId, period, newItems);
      await setLastUsedPeriod(clientId, period);
    } catch (error) {
      console.warn('Erreur lors de la mise à jour du cache:', error);
    }
  })();

    // Persister en base pour ne pas perdre au changement de page
    try {
      await saveBalance(newItems.map(i => ({
        accountNumber: i.accountNumber,
        accountName: i.accountName,
        debit: i.debit,
        credit: i.credit,
        balance: i.balance,
        clientId: i.clientId,
        period: i.period,
        importIndex: i.importIndex,
        originalDebit: (i as any).originalDebit,
        originalCredit: (i as any).originalCredit,
      })));
      // Après sauvegarde serveur, on s'aligne côté cache Supabase
      await setBalanceLocalCache(clientId, period, newItems);
      await setLastUsedPeriod(clientId, period);
    } catch (e: any) {
      showNotification({
        type: "warning",
        title: "Sauvegarde locale uniquement",
        message: `Impossible d'enregistrer en base pour le moment: ${e?.message || ''}`,
        duration: 4000,
      });
    }

    // Afficher un message de succès
    if (newItems.length > 0) {
      console.log(`✅ ${newItems.length} éléments importés avec succès`);
      showNotification({
        type: "success",
        title: "Importation réussie",
        message: `${newItems.length} élément${
          newItems.length > 1 ? "s" : ""
        } de balance importé${
          newItems.length > 1 ? "s" : ""
        } avec succès. Les données importées sont marquées avec un index de ligne.`,
        duration: 5000,
      });
      // Forcer un re-render en loggant l'état
      setTimeout(() => {
        console.log("🔄 État après import:", newItems);
      }, 100);
    } else {
      console.log("⚠️ Aucun élément valide à importer");
      showNotification({
        type: "warning",
        title: "Aucune donnée importée",
        message:
          "Aucun élément valide trouvé dans le fichier. Vérifiez le format des données.",
        duration: 5000,
      });
    }
  };

  // Utiliser uniquement les données importées et les trier par numéro de compte
  const allBalanceItems = [...importedItems].sort((a, b) => {
    const accountA = a.accountNumber || "";
    const accountB = b.accountNumber || "";

    // Tri numérique intelligent pour les numéros de compte
    const numA = parseInt(accountA.replace(/\D/g, "")) || 0;
    const numB = parseInt(accountB.replace(/\D/g, "")) || 0;

    if (numA !== numB) {
      return numA - numB;
    }

    // Si les numéros sont identiques, tri alphabétique
    return accountA.localeCompare(accountB);
  });

  // Debug pour vérifier l'état
  console.log("📊 Données importées:", importedItems.length);
  console.log(
    "📊 Éléments avec importIndex:",
    allBalanceItems.filter((item) => (item as any).importIndex !== undefined)
      .length
  );

  const renderBalanceTable = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Balance générale
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <FileImporter
            onImport={handleImport}
            expectedColumns={["N° Compte", "Libellé", "Débit", "Crédit"]}
            title="Importer la balance"
            description="Importez les données de balance depuis un fichier Excel ou CSV"
            helpType="balance"
          />
          {/* Sélecteur simple de période (optionnel) */}
          <input
            type="text"
            value={period}
            onChange={(e) => { 
              setPeriod(e.target.value); 
              (async () => {
                try {
                  await setLastUsedPeriod(clientId, e.target.value);
                } catch (error) {
                  console.warn('Erreur lors de la sauvegarde de la période:', error);
                }
              })();
            }}
            className="px-2 py-1 text-sm border rounded"
            placeholder="Période (ex: 2024-01)"
            title="Période de la balance"
          />
          {importedItems.length > 0 && (
            <button
              onClick={() => {
                (async () => {
                  setImportedItems([]);
                  try {
                    await clearBalanceLocalCache(clientId, period);
                    await clearBalance(clientId, period);
                  } catch (error) {
                    console.warn('Erreur lors de la suppression:', error);
                  }
                  showNotification({
                    type: "info",
                    title: "Données effacées",
                    message: "Les données importées ont été supprimées.",
                    duration: 3000,
                  });
                })();
              }}
              className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
              title="Effacer les données importées"
            >
              X
            </button>
          )}
        </div>
      </div>
      {(loading || allBalanceItems.length === 0) && (
        <div className="p-8 text-center text-gray-500">
          {loading ? (
            <p>Chargement des données de balance…</p>
          ) : (
            <p>
              Aucune donnée disponible. Importez un fichier CSV pour commencer.
            </p>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                N° Compte
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Libellé
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Débit
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Crédit
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Solde
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allBalanceItems.map((item) => {
              const isImported = (item as any).importIndex !== undefined;
              console.log(`🎨 Rendu ligne ${item._id}:`, {
                isImported,
                importIndex: (item as any).importIndex,
              });

              return (
                <tr
                  key={item._id}
                  className={`hover:bg-gray-50 ${
                    isImported ? "bg-green-50 border-l-4 border-green-400" : ""
                  }`}
                >
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                    <span
                      className={isImported ? "font-bold text-green-800" : ""}
                      title={`Compte: "${item.accountNumber}" (longueur: ${
                        item.accountNumber?.length || 0
                      })`}
                    >
                      {item.accountNumber || ""}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span
                      title={`Libellé: "${item.accountName}" (longueur: ${
                        item.accountName?.length || 0
                      })`}
                    >
                      {item.accountName || ""}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-mono font-medium text-gray-900">
                    <span
                      title={`Débit original: "${
                        (item as any).originalDebit
                      }" (type: ${typeof (item as any).originalDebit})`}
                    >
                      {(item as any).originalDebit &&
                      (item as any).originalDebit !== "0" &&
                      (item as any).originalDebit !== "0,00" &&
                      (item as any).originalDebit !== "0.00"
                        ? (item as any).originalDebit
                        : ""}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-mono font-medium text-gray-900">
                    <span
                      title={`Crédit original: "${
                        (item as any).originalCredit
                      }" (type: ${typeof (item as any).originalCredit})`}
                    >
                      {(item as any).originalCredit &&
                      (item as any).originalCredit !== "0" &&
                      (item as any).originalCredit !== "0,00" &&
                      (item as any).originalCredit !== "0.00"
                        ? (item as any).originalCredit
                        : ""}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-2 whitespace-nowrap text-sm text-right font-mono font-semibold ${
                      item.balance > 0
                        ? "text-green-600"
                        : item.balance < 0
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    {formatCurrency(Math.abs(item.balance))}
                    {item.balance < 0 && " (C)"}
                    {item.balance > 0 && " (D)"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td
                colSpan={2}
                className="px-4 py-2 text-sm font-bold text-gray-900 bg-gray-50"
              >
                TOTAUX
              </td>
              <td className="px-4 py-2 text-sm font-mono font-bold text-right text-gray-900 bg-gray-50">
                {new Intl.NumberFormat("fr-FR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                }).format(
                  allBalanceItems.reduce(
                    (sum, item) => addNumbers(sum, item.debit),
                    0
                  )
                )}
              </td>
              <td className="px-4 py-2 text-sm font-mono font-bold text-right text-gray-900 bg-gray-50">
                {new Intl.NumberFormat("fr-FR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                }).format(
                  allBalanceItems.reduce(
                    (sum, item) => addNumbers(sum, item.credit),
                    0
                  )
                )}
              </td>
              <td className="px-4 py-2 text-sm font-mono font-bold text-right text-gray-900 bg-gray-50">
                -
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  const renderIndicators = () => (
    <div className="space-y-6">
      {/* Graphique circulaire de la structure financière */}
      {importedItems.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Structure financière
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center">
              {(() => {
                const total =
                  indicators.totalAssets +
                  indicators.totalLiabilities +
                  indicators.totalEquity;
                if (total === 0)
                  return <p className="text-gray-500">Aucune donnée</p>;

                const assetsPercent = (indicators.totalAssets / total) * 100;
                const liabilitiesPercent =
                  (indicators.totalLiabilities / total) * 100;
                const equityPercent = (indicators.totalEquity / total) * 100;

                return (
                  <div className="flex items-center space-x-8">
                    <div className="relative w-48 h-48">
                      <svg
                        className="w-48 h-48 transform -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                        />
                        {/* Actifs */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#3b82f6"
                          strokeWidth="8"
                          strokeDasharray={`${assetsPercent * 2.51} ${
                            (100 - assetsPercent) * 2.51
                          }`}
                          strokeDashoffset="0"
                        />
                        {/* Passifs */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#ef4444"
                          strokeWidth="8"
                          strokeDasharray={`${liabilitiesPercent * 2.51} ${
                            (100 - liabilitiesPercent) * 2.51
                          }`}
                          strokeDashoffset={`-${assetsPercent * 2.51}`}
                        />
                        {/* Capitaux propres */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#10b981"
                          strokeWidth="8"
                          strokeDasharray={`${equityPercent * 2.51} ${
                            (100 - equityPercent) * 2.51
                          }`}
                          strokeDashoffset={`-${
                            (assetsPercent + liabilitiesPercent) * 2.51
                          }`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            Total
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(total)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Actifs
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(indicators.totalAssets)} (
                            {assetsPercent.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Passifs
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(indicators.totalLiabilities)} (
                            {liabilitiesPercent.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Capitaux propres
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(indicators.totalEquity)} (
                            {equityPercent.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Indicateurs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Actif</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(indicators.totalAssets)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Passif</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(indicators.totalLiabilities)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Capitaux Propres
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(indicators.totalEquity)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PieChart className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Résultat Net</p>
              <p
                className={`text-2xl font-semibold ${
                  indicators.netResult >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(indicators.netResult)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ratios financiers */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Ratios financiers
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Fonds de roulement
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(indicators.workingCapital)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Ratio de liquidité
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {indicators.currentRatio.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Ratio d'endettement
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {(indicators.debtRatio * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Marge bénéficiaire
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {indicators.profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Répartition par classe de comptes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Répartition par classe de comptes
          </h3>
        </div>
        <div className="p-6">
          {importedItems.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                // Calculer la répartition par classe
                const classes = {
                  "Classe 1 - Capitaux": 0,
                  "Classe 2 - Immobilisations": 0,
                  "Classe 3 - Stocks": 0,
                  "Classe 4 - Tiers": 0,
                  "Classe 5 - Financier": 0,
                  "Classe 6 - Charges": 0,
                  "Classe 7 - Produits": 0,
                };

                importedItems.forEach((item) => {
                  const accountNum = item.accountNumber || "";
                  const balance = Math.abs(item.balance || 0);

                  if (accountNum.startsWith("1"))
                    classes["Classe 1 - Capitaux"] += balance;
                  else if (accountNum.startsWith("2"))
                    classes["Classe 2 - Immobilisations"] += balance;
                  else if (accountNum.startsWith("3"))
                    classes["Classe 3 - Stocks"] += balance;
                  else if (accountNum.startsWith("4"))
                    classes["Classe 4 - Tiers"] += balance;
                  else if (accountNum.startsWith("5"))
                    classes["Classe 5 - Financier"] += balance;
                  else if (accountNum.startsWith("6"))
                    classes["Classe 6 - Charges"] += balance;
                  else if (accountNum.startsWith("7"))
                    classes["Classe 7 - Produits"] += balance;
                });

                const total = Object.values(classes).reduce(
                  (sum, val) => sum + val,
                  0
                );
                const maxValue = Math.max(...Object.values(classes));

                return Object.entries(classes).map(([className, value]) => {
                  const percentage = total > 0 ? (value / total) * 100 : 0;
                  const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;

                  return (
                    <div
                      key={className}
                      className="flex items-center space-x-4"
                    >
                      <div className="w-32 text-sm font-medium text-gray-700 flex-shrink-0">
                        {className}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div
                          className="bg-blue-600 h-6 rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">
                            {formatCurrency(value)}
                          </span>
                        </div>
                      </div>
                      <div className="w-16 text-sm text-gray-600 text-right">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Aucune donnée à afficher</p>
                <p className="text-sm text-gray-400">
                  Importez des données de balance pour voir les graphiques
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Graphique des soldes par type de compte */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Analyse des soldes
          </h3>
        </div>
        <div className="p-6">
          {importedItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-4">
                  Soldes débiteurs
                </h4>
                <div className="space-y-2">
                  {importedItems
                    .filter((item) => item.balance > 0)
                    .sort((a, b) => b.balance - a.balance)
                    .slice(0, 5)
                    .map((item, index) => (
                      <div
                        key={item._id}
                        className="flex justify-between items-center py-2 border-b border-gray-100"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {item.accountNumber} - {item.accountName}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(item.balance)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-4">
                  Soldes créditeurs
                </h4>
                <div className="space-y-2">
                  {importedItems
                    .filter((item) => item.balance < 0)
                    .sort((a, b) => a.balance - b.balance)
                    .slice(0, 5)
                    .map((item, index) => (
                      <div
                        key={item._id}
                        className="flex justify-between items-center py-2 border-b border-gray-100"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {item.accountNumber} - {item.accountName}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-red-600">
                          {formatCurrency(Math.abs(item.balance))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Aucune donnée à analyser</p>
            </div>
          )}
        </div>
      </div>

      {/* Top comptes par montant */}
      {importedItems.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Comptes les plus significatifs
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {(() => {
                const sortedItems = [...importedItems].sort(
                  (a, b) => Math.abs(b.balance) - Math.abs(a.balance)
                );
                const maxBalance = Math.abs(sortedItems[0]?.balance || 1);

                return sortedItems.slice(0, 10).map((item, index) => {
                  const currentBalance = Math.abs(item.balance);
                  const percentage = (currentBalance / maxBalance) * 100;

                  return (
                    <div key={item._id} className="flex items-center space-x-4">
                      <div className="w-8 text-sm font-medium text-gray-500">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {item.accountNumber} - {item.accountName}
                          </div>
                          <div
                            className={`text-sm font-semibold ${
                              item.balance >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(currentBalance)}
                            {item.balance < 0 ? " (C)" : " (D)"}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              item.balance >= 0 ? "bg-green-500" : "bg-red-500"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Sub-navigation */}
      <div className="flex border-b border-gray-200 bg-white px-6">
        <button
          onClick={() => setActiveSubPage("balance")}
          className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeSubPage === "balance"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Balance détaillée
        </button>
        <button
          onClick={() => setActiveSubPage("indicators")}
          className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeSubPage === "indicators"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Indicateurs graphiques
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeSubPage === "balance"
          ? renderBalanceTable()
          : renderIndicators()}
      </div>
    </div>
  );
};

export default BalancePage;
