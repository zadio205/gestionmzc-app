"use client";

import React from "react";
import { Calendar, Download, FileText, RefreshCw, Trash2 } from "lucide-react";
import FileImporter from "@/components/ui/FileImporter";

interface BalanceControlsProps {
  period: string;
  onPeriodChange: (period: string) => void;
  onImport: (data: any[]) => void;
  onClear: () => void;
  onRefresh: () => void;
  loading?: boolean;
  itemCount?: number;
}

const BalanceControls: React.FC<BalanceControlsProps> = ({
  period,
  onPeriodChange,
  onImport,
  onClear,
  onRefresh,
  loading = false,
  itemCount = 0
}) => {
  const handleFileImport = (parsedData: any[]) => {
    // Transformer les données pour correspondre au format BalanceItem
    const transformedData = parsedData.map((row, index) => ({
      _id: `imported-${Date.now()}-${index}`,
      accountNumber: row['N° Compte'] || row.accountNumber || '',
      accountName: row['Libellé'] || row.accountName || '',
      debit: parseFloat(row['Débit'] || row.debit || '0'),
      credit: parseFloat(row['Crédit'] || row.credit || '0'),
      balance: 0, // Sera calculé
      originalDebit: row['Débit'] || row.debit || '0',
      originalCredit: row['Crédit'] || row.credit || '0',
      clientId: '', // Sera défini par le parent
      period: period,
      createdAt: new Date(),
      importIndex: index
    }));

    onImport(transformedData);
  };

  const importConfig = {
    expectedColumns: ['N° Compte', 'Libellé', 'Débit', 'Crédit'],
    title: 'Importer une balance comptable',
    description: 'Importez un fichier CSV ou Excel contenant les données de balance',
    acceptedFormats: ['.csv', '.xlsx', '.xls']
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Période */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <label htmlFor="period" className="text-sm font-medium text-gray-700">
              Période :
            </label>
          </div>
          <input
            type="month"
            id="period"
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Statistiques */}
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-gray-500">Lignes importées : </span>
            <span className="font-medium text-gray-900">{itemCount}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <FileImporter
            onImport={handleFileImport}
            expectedColumns={importConfig.expectedColumns}
            title={importConfig.title}
            description={importConfig.description}
            acceptedFormats={importConfig.acceptedFormats}
            helpType="balance"
          />

          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>

          {itemCount > 0 && (
            <button
              onClick={onClear}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Vider
            </button>
          )}
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Format d'importation attendu :</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Fichier CSV ou Excel (.csv, .xlsx, .xls)</li>
              <li>Colonnes requises : N° Compte, Libellé, Débit, Crédit</li>
              <li>Les montants doivent être au format numérique (ex: 1000.50)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceControls;