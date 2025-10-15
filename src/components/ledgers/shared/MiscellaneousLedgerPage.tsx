'use client';

import React, { useMemo, useState } from 'react';
import { useMiscLedgerState } from '@/hooks/useMiscLedgerState';
import { useMiscLedgerAnalysis } from '@/hooks/useLedgerAnalysis';
import { useJustificationRequests } from '@/hooks/useJustificationRequests';
import { useNotification } from '@/contexts/NotificationContextSimple';
import MiscellaneousLedgerHeader from './MiscellaneousLedgerHeader';
import ModernLedgerDisplay from './ModernLedgerDisplay';
import AnalysisPanel from '../AnalysisPanel';
import UploadJustificatifModal from './UploadJustificatifModal';

interface MiscellaneousLedgerPageProps {
  clientId: string;
  clientName?: string;
}

const MiscellaneousLedgerPage: React.FC<MiscellaneousLedgerPageProps> = ({ 
  clientId,
  clientName = 'Client'
}) => {
  const ledgerState = useMiscLedgerState(clientId);
  const miscAnalysisResult = useMiscLedgerAnalysis(ledgerState.entries);
  const justificationRequests = useJustificationRequests();
  const { showNotification } = useNotification();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadContext, setUploadContext] = useState<{ entryId: string; clientId: string } | null>(null);

  const adaptMiscToClient = (entry: any) => ({
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
    clientName: entry.accountName,
    invoiceNumber: entry.reference,
    createdAt: entry.createdAt,
    importIndex: entry.importIndex,
    aiMeta: entry.aiMeta
  });

  const analysisResult = useMemo(() => ({
    unsolvedInvoices: miscAnalysisResult.unsolvedEntries.map(adaptMiscToClient),
    paymentsWithoutJustification: miscAnalysisResult.paymentsWithoutJustification.map(adaptMiscToClient),
    suspiciousEntries: miscAnalysisResult.suspiciousEntries.map(adaptMiscToClient)
  }), [miscAnalysisResult]);

  const handleBulkRequestJustifications = async () => {
    const selectedEntriesArray = Array.from(ledgerState.selectedEntries);
    let count = 0;

    for (const entryId of selectedEntriesArray) {
      const entry = ledgerState.entries.find((e) => e._id === entryId);
      if (entry) {
        setUploadContext({ entryId: entry._id, clientId: entry.clientId });
        setUploadModalOpen(true);
        count++;
      }
    }

    ledgerState.setSelectedEntries(new Set());
    showNotification({
      title: 'Ajout de pièces jointes',
      message: `${count} écriture(s) sélectionnée(s) pour ajout de pièces jointes`,
      type: 'success'
    });
  };

  const getEntryStatus = (entry: any) => {
    if ((entry?.credit || 0) > 0) {
      return { type: 'error', label: 'Justificatif manquant' };
    }
    if (entry.aiMeta && (entry.aiMeta.suspiciousLevel === 'medium' || entry.aiMeta.suspiciousLevel === 'high')) {
      return { type: 'warning', label: 'Justificatif manquant' };
    }
    return { type: 'warning', label: 'Justificatif manquant' };
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
      <MiscellaneousLedgerHeader
        selectedPeriod={ledgerState.selectedPeriod}
        onPeriodChange={ledgerState.setSelectedPeriod}
        showAnalysis={ledgerState.showAnalysis}
        onToggleAnalysis={() => ledgerState.setShowAnalysis(!ledgerState.showAnalysis)}
        selectedEntriesCount={ledgerState.selectedEntries.size}
        onBulkRequest={handleBulkRequestJustifications}
        isGenerating={justificationRequests.isGenerating}
        onImport={ledgerState.handleImport}
        analysisCount={
          (miscAnalysisResult.unsolvedEntries?.length || 0) +
          (miscAnalysisResult.paymentsWithoutJustification?.length || 0)
        }
        onReload={ledgerState.reloadFromDb}
        onClear={ledgerState.clearForClient}
        sortBy={ledgerState.sortBy}
        onSortChange={ledgerState.setSortBy}
      />

      <div >
        {ledgerState.showAnalysis && (
          <AnalysisPanel
            analysisResult={analysisResult}
            llmSuggestions={ledgerState.llmSuggestions}
            onSelectEntries={ledgerState.setSelectedEntries}
            onGenerateSuggestions={() => {}}
          />
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {ledgerState.visibleEntries.length > 0 ? (
          <ModernLedgerDisplay
            entries={ledgerState.visibleEntries}
            type="miscellaneous"
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onEntryClick={(entry) => console.log('Entry clicked:', entry)}
            getEntryStatus={getEntryStatus}
            onCommentAdd={(entryId, comment) => console.log('Comment added:', entryId, comment)}
            onEdit={(entry) => console.log('Edit entry:', entry)}
            onDelete={(entry) => console.log('Delete entry:', entry)}
            onExport={(entry) => console.log('Export entry:', entry)}
            onAddDocument={(entry) => { setUploadContext({ entryId: entry._id, clientId: entry.clientId }); setUploadModalOpen(true); }}
          />
        ) : (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-medium mb-2">Aucune écriture</h3>
              <p className="text-sm">
                {ledgerState.searchTerm
                  ? "Aucune écriture ne correspond à votre recherche."
                  : "Importez un fichier CSV/Excel pour commencer."}
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadModalOpen && uploadContext && (
        <UploadJustificatifModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          clientId={uploadContext.clientId}
          entryId={uploadContext.entryId}
          onUploaded={() => {}}
        />
      )}
    </div>
  );
};

export default MiscellaneousLedgerPage;
