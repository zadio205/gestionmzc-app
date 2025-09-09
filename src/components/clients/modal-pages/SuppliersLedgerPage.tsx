'use client';

import React, { useState, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import { useSupplierLedgerState } from '@/hooks/useSupplierLedgerState';
import { useSupplierLedgerAnalysis } from '@/hooks/useSupplierLedgerAnalysis';
import { useJustificationRequests } from '@/hooks/useJustificationRequests';
import { useNotification } from '@/contexts/NotificationContextSimple';
import SuppliersLedgerHeader from './SuppliersLedgerHeader';
import ModernLedgerDisplay from './ModernLedgerDisplay';
import AnalysisPanel from '../AnalysisPanel';
import { SearchBar } from './SearchBar';
import LLMStatusIndicator from '@/components/ui/LLMStatusIndicator';

interface SuppliersLedgerPageProps {
  clientId: string;
  clientName: string;
}

const SuppliersLedgerPage: React.FC<SuppliersLedgerPageProps> = ({
  clientId,
  clientName
}) => {
  const ledgerState = useSupplierLedgerState(clientId);
  const supplierAnalysisResult = useSupplierLedgerAnalysis(ledgerState.entries);
  
  // Fonction pour adapter une entrée fournisseur vers le format client
  const adaptSupplierToClient = (entry: any) => ({
    _id: entry._id,
    date: entry.date,
    accountNumber: entry.accountNumber,
    accountName: entry.accountName,
    description: entry.description,
    debit: entry.debit,
    credit: entry.credit,
    balance: entry.balance,
    reference: entry.reference,
    clientId: entry.clientId,
    type: 'client' as const,
    clientName: entry.supplierName,
    invoiceNumber: entry.billNumber,
    createdAt: entry.createdAt,
    importIndex: entry.importIndex,
    aiMeta: entry.aiMeta ? {
      suspiciousLevel: entry.aiMeta.suspiciousLevel,
      reasons: entry.aiMeta.reasons,
      suggestions: entry.aiMeta.suggestions || []
    } : undefined
  });

  // Adapter les résultats d'analyse des fournisseurs pour le composant AnalysisPanel
  const analysisResult = useMemo(() => ({
    unsolvedInvoices: supplierAnalysisResult.unsolvedBills.map(adaptSupplierToClient),
    paymentsWithoutJustification: supplierAnalysisResult.paymentsWithoutJustification.map(adaptSupplierToClient),
    suspiciousEntries: supplierAnalysisResult.suspiciousEntries.map(adaptSupplierToClient)
  }), [supplierAnalysisResult]);
  
  const justificationRequests = useJustificationRequests();
  const { showNotification } = useNotification();

  const handleBulkRequestJustifications = async () => {
    const selectedEntriesArray = Array.from(ledgerState.selectedEntries);
    let count = 0;

    for (const entryId of selectedEntriesArray) {
      const entry = ledgerState.entries.find((e) => e._id === entryId);
      if (entry) {
        const type = entry.credit > 0 ? "payment" : "invoice";
        const adaptedEntry = adaptSupplierToClient(entry);
        await justificationRequests.requestJustification(adaptedEntry, type);
        count++;
      }
    }

    ledgerState.setSelectedEntries(new Set());
    showNotification({
      title: 'Demandes envoyées',
      message: `${count} demandes de justificatifs envoyées`,
      type: 'success'
    });
  };

  const getEntryStatus = (entry: any) => {
    // Pour les factures (débit > 0)
    if (entry.debit > 0) {
      // Vérifier si elle est dans les factures non réglées
      const isUnsolvedBill = supplierAnalysisResult.unsolvedBills.some(bill => bill._id === entry._id);
      if (isUnsolvedBill) {
        return { type: 'error', label: 'Facture non réglée' };
      }
      
      // Vérifier si le numéro de facture est manquant
      if (!entry.billNumber || entry.billNumber.trim().length === 0) {
        return { type: 'warning', label: 'N° facture manquant' };
      }
      
      return { type: 'success', label: 'Facture réglée' };
    }
    
    // Pour les paiements (crédit > 0)
    if (entry.credit > 0) {
      // Vérifier si c'est un paiement sans justificatif
      const hasValidReference = entry.reference && 
        entry.reference.length >= 5 && 
        entry.reference.match(/^(FACT|REG|CHQ|VIR|BON|PAY)/i);
      
      const hasValidBillNumber = entry.billNumber && entry.billNumber.trim().length > 0;
      
      if (!hasValidReference && !hasValidBillNumber) {
        return { type: 'warning', label: 'Justificatif manquant' };
      }
      
      return { type: 'success', label: 'Paiement justifié' };
    }
    
    return { type: 'success', label: 'Complète' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('fr-FR').format(date);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <SuppliersLedgerHeader
        selectedPeriod={ledgerState.selectedPeriod}
        onPeriodChange={ledgerState.setSelectedPeriod}
        showAnalysis={ledgerState.showAnalysis}
        onToggleAnalysis={() => ledgerState.setShowAnalysis(!ledgerState.showAnalysis)}
        selectedEntriesCount={ledgerState.selectedEntries.size}
        onBulkRequest={handleBulkRequestJustifications}
        isGenerating={justificationRequests.isGenerating}
        onImport={ledgerState.handleImport}
        analysisCount={
          supplierAnalysisResult.unsolvedBills?.length || 0 +
          supplierAnalysisResult.paymentsWithoutJustification?.length || 0
        }
        onReload={ledgerState.reloadFromDb}
        onClear={ledgerState.clearForClient}
      />

      <div className="p-6">
        <SearchBar
          searchTerm={ledgerState.searchTerm}
          onSearchChange={ledgerState.setSearchTerm}
        />

        {ledgerState.showAnalysis && (
          <AnalysisPanel
            analysisResult={analysisResult}
            llmSuggestions={ledgerState.llmSuggestions}
            onSelectEntries={ledgerState.setSelectedEntries}
            onGenerateSuggestions={() => {}}
          />
        )}

        {/* Indicateur de statut LLM */}
        <div className="mt-4">
          <LLMStatusIndicator className="max-w-md" />
        </div>

        {/* Info sur les données importées */}
        {ledgerState.entries.filter(e => e.importIndex !== undefined).length > 0 && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-green-700 font-medium">
                {ledgerState.entries.filter(e => e.importIndex !== undefined).length} entrée(s) importée(s) récemment
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {ledgerState.filteredEntries.length > 0 ? (
          <ModernLedgerDisplay
            entries={ledgerState.filteredEntries}
            type="suppliers"
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onEntryClick={(entry) => console.log('Entry clicked:', entry)}
            getEntryStatus={getEntryStatus}
            onCommentAdd={(entryId, comment) => console.log('Comment added:', entryId, comment)}
            onEdit={(entry) => console.log('Edit entry:', entry)}
            onDelete={(entry) => console.log('Delete entry:', entry)}
            onExport={(entry) => console.log('Export entry:', entry)}
            onSendRequest={(entry) => console.log('Send request:', entry)}
          />
        ) : (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-medium mb-2">Aucune écriture fournisseur</h3>
              <p className="text-sm">
                {ledgerState.searchTerm
                  ? "Aucune écriture ne correspond à votre recherche."
                  : "Importez un fichier CSV/Excel pour commencer."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuppliersLedgerPage;
