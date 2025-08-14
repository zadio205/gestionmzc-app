"use client";

import React, { useEffect, useState } from "react";
import { Search, Filter, Download, Calendar } from "lucide-react";
import { MiscellaneousLedger } from "@/types/accounting";
import type { ImportedRow as SharedImportedRow } from "@/types/accounting";
import { enrichEntriesAI } from "@/services/aiAdapter";
import FileImporter from "@/components/ui/FileImporter";
import { useNotification } from "@/contexts/NotificationContextSimple";
import { CSVSanitizer } from "@/utils/csvSanitizer";
import { dedupBySignature, getMiscLedgerSignature } from "@/utils/ledgerDedup";
import { getMiscLedgerCache, setMiscLedgerCache, clearMiscLedgerCache } from "@/lib/miscLedgerCache";

interface MiscellaneousLedgerPageProps {
  clientId: string;
}

const MiscellaneousLedgerPage: React.FC<MiscellaneousLedgerPageProps> = ({ clientId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("2024-01");
  const [importedEntries, setImportedEntries] = useState<MiscellaneousLedger[]>([]);
  const { showNotification } = useNotification();

  // Charger depuis cache mémoire si présent
  useEffect(() => {
    if (!clientId) return;
    const cached = getMiscLedgerCache(clientId);
    if (cached && cached.length > 0) {
      setImportedEntries(cached);
    }
  }, [clientId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    return date ? new Intl.DateTimeFormat("fr-FR").format(date) : "";
  };

  const handleImport = async (importedData: SharedImportedRow[]) => {
  const newEntries: MiscellaneousLedger[] = importedEntries.concat(
      importedData
        .filter((row) => row.isValid)
        .map((row, index) => {
          // Normalisation des en-têtes (casse/accents/espaces/BOM)
          const normalize = (s: string) =>
            String(s || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/\p{Diacritic}/gu, "")
              .replace(/^\uFEFF/, "")
              .replace(/[\u00a0\t]+/g, " ")
              .replace(/\s+/g, " ")
              .trim();

          const headerMap: Record<string, string> = {};
          Object.keys(row.data || {}).forEach((key) => {
            headerMap[normalize(key)] = key;
          });

          const findColumnValue = (possibleNames: string[]) => {
            for (const name of possibleNames) {
              const originalKey = headerMap[normalize(name)];
              if (originalKey !== undefined && row.data[originalKey] !== null && row.data[originalKey] !== undefined) {
                const value = String(row.data[originalKey]).trim();
                if (value !== "") return value;
              }
            }
            return "";
          };

          const dateStr = findColumnValue(["Date", "date"]);
          const accountNumber = CSVSanitizer.sanitizeString(
            findColumnValue(["N° Compte", "Compte", "accountNumber", "N°compte", "N°Compte", "Numéro compte"])
          );
          const accountName = CSVSanitizer.sanitizeString(
            findColumnValue(["Libellé", "accountName", "Libelle"])
          );
          const description = CSVSanitizer.sanitizeString(
            findColumnValue(["Description", "Libellé détaillé", "description", "libelle", "libellé détaillé"])
          );
          const reference = CSVSanitizer.sanitizeString(
            findColumnValue(["Référence", "Reference", "Ref", "reference", "référence"])
          );
          const debitStr = findColumnValue(["Débit", "Debit", "debit", "débits", "montant débit", "montant debit"]);
          const creditStr = findColumnValue(["Crédit", "Credit", "credit", "crédits", "montant crédit", "montant credit"]);
          const category = CSVSanitizer.sanitizeString(
            findColumnValue(["Catégorie", "Category", "category"])
          );

          const debit = CSVSanitizer.sanitizeNumeric(debitStr);
          const credit = CSVSanitizer.sanitizeNumeric(creditStr);

          const date = CSVSanitizer.sanitizeDate(dateStr);

          return {
            _id: `imported-${Date.now()}-${index}`,
            date,
            accountNumber,
            accountName,
            description,
            debit,
            credit,
            balance: debit - credit,
            reference,
            clientId,
            type: "miscellaneous" as const,
            category,
            createdAt: new Date(),
            importIndex: row.index - 1,
          };
        })
    );

    // Enrichissement IA
  let enriched = newEntries;
    try {
      enriched = await enrichEntriesAI(newEntries);
    } catch (e) {
      console.warn('Enrichissement IA (comptes divers) indisponible');
    }
  // Déduplication avec l’existant
  const existingSigs = new Set(importedEntries.map(getMiscLedgerSignature));
  const { unique } = dedupBySignature(enriched, getMiscLedgerSignature, existingSigs);
  const addedCount = unique.length;
  const duplicateCount = enriched.length - addedCount;
  const merged = [...importedEntries, ...unique];
  setImportedEntries(merged);
  try { setMiscLedgerCache(clientId, merged); } catch {}

    if (addedCount > 0) {
      showNotification({
        type: "success",
        title: "Import comptes divers réussi",
        message: `${addedCount} entrée${addedCount > 1 ? "s" : ""} importée${addedCount > 1 ? "s" : ""} avec succès.`,
        duration: 5000,
      });
    }
    if (duplicateCount > 0) {
      showNotification({
        type: "warning",
        title: "Doublons ignorés",
        message: `${duplicateCount} doublon${duplicateCount > 1 ? "s" : ""} détecté${duplicateCount > 1 ? "s" : ""} et ignoré${duplicateCount > 1 ? "s" : ""}.`,
        duration: 5000,
      });
    }
  };

  const filteredEntries = importedEntries.filter(
    (entry) =>
      (entry.accountName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.reference || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Comptes divers</h2>
            <p className="text-sm text-gray-600">Écritures diverses</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="2024-01">Janvier 2024</option>
                <option value="2023-12">Décembre 2023</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <FileImporter
                onImport={handleImport}
                expectedColumns={["Date", "N° Compte", "Libellé", "Description", "Référence", "Débit", "Crédit", "Catégorie"]}
                title="Importer comptes divers"
                description="Importez les écritures des comptes divers depuis un fichier Excel ou CSV"
                helpType="miscellaneous"
              />
              <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700">
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </button>
              <button
                onClick={() => { setImportedEntries([]); try { clearMiscLedgerCache(clientId); } catch {} }}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
              >
                <span>Vider</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par libellé, description ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">N° Compte</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Libellé</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Référence</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider tabular-nums w-28">Débit</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider tabular-nums w-28">Crédit</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider tabular-nums w-28">Solde</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <tr key={entry._id} className={(entry as any).importIndex !== undefined ? "bg-orange-50" : undefined}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-28">{entry.date ? formatDate(entry.date) : ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-32">{entry.accountNumber || ""}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{entry.accountName || ""}</td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{entry.description || ""}</span>
                      {entry.aiMeta && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                            entry.aiMeta.suspiciousLevel === 'high'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : entry.aiMeta.suspiciousLevel === 'medium'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-green-50 text-green-700 border-green-200'
                          }`}
                          title={`Analyse IA: ${entry.aiMeta.suspiciousLevel}\n- ${(entry.aiMeta.reasons || []).join('\n- ')}`}
                        >
                          IA {entry.aiMeta.suspiciousLevel}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-32">{entry.reference || ""}</td>
                  {(() => {
                    const isAmountEmpty = ((entry.debit || 0) === 0) && ((entry.credit || 0) === 0);
                    return (
                      <>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900 tabular-nums w-28">{isAmountEmpty ? "" : (entry.debit > 0 ? formatCurrency(entry.debit) : "")}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900 tabular-nums w-28">{isAmountEmpty ? "" : (entry.credit > 0 ? formatCurrency(entry.credit) : "")}</td>
                        <td className={`px-3 py-2 whitespace-nowrap text-sm text-right font-medium tabular-nums w-28 ${entry.balance < 0 ? "text-red-600" : entry.balance > 0 ? "text-green-600" : "text-gray-900"}`}>
                          {isAmountEmpty ? "" : formatCurrency(Math.abs(entry.balance))}
                        </td>
                      </>
                    );
                  })()}
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{entry.category || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 mt-6">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium">Aucune écriture trouvée</p>
              <p className="text-sm">{searchTerm ? "Aucune écriture ne correspond à votre recherche." : "Aucune écriture pour cette période."}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiscellaneousLedgerPage;
