"use client";

import React, { useEffect, useState } from "react";
import ClientsLedgerHeader from "../shared/ClientsLedgerHeader";
import AnalysisPanel from "../AnalysisPanel";
import ModernLedgerDisplay from "./ModernLedgerDisplay";
import JustificationRequestsPanel from "@/components/ledgers/shared/JustificationRequestsPanel";
import UploadJustificatifModal from "@/components/ledgers/shared/UploadJustificatifModal";
import EntryDetailsModal from "@/components/clients/modal-pages/EntryDetailsModal";
import { useClientLedgerState } from "@/hooks/useClientLedgerState";
import { useJustificationRequests } from "@/hooks/useJustificationRequests";
import { useClientLedgerAnalysis } from "@/hooks/useLedgerAnalysis";
import { useNotification } from "@/contexts/NotificationContextSimple";

import { ClientLedgerService } from "@/services/clientLedgerService";
import { llmService } from "@/services/llmService";

interface ClientsLedgerContainerProps {
  clientId: string;
}

export const ClientsLedgerContainer: React.FC<ClientsLedgerContainerProps> = ({
  clientId,
}) => {
  const ledgerState = useClientLedgerState(clientId);
  const justificationRequests = useJustificationRequests();
  const analysisResult = useClientLedgerAnalysis(ledgerState.entries);
  const { showNotification } = useNotification();
  const isClientIdInvalid =
    !clientId || typeof clientId !== "string" || clientId.trim().length === 0;

  const handleBulkRequestJustifications = async () => {
    const selectedEntriesArray = Array.from(ledgerState.selectedEntries);
    let count = 0;

    for (const entryId of selectedEntriesArray) {
      const entry = ledgerState.entries.find((e) => e._id === entryId);
      if (entry) {
        // Remplacement de l'envoi de demande par l'ouverture de l'upload de pièces jointes
        (window as any).dispatchEvent(new CustomEvent('open-upload-justificatif', { detail: { entryId: entry._id, clientId: entry.clientId } }));
        count++;
      }
    }

    ledgerState.setSelectedEntries(new Set());
  };

  const generateLLMSuggestions = async () => {
    try {
      const suggestions = await llmService.generateImprovementSuggestions(
        ledgerState.entries
      );
      ledgerState.setLlmSuggestions(suggestions);
    } catch (error) {
      console.warn("Erreur génération suggestions LLM:", error);
    }
  };

  const getEntryStatus = (entry: import("@/types/accounting").ClientLedger) => {
    return ClientLedgerService.getEntryStatus(entry, analysisResult);
  };

  // Upload justificatif modal handling
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadContext, setUploadContext] = useState<{ entryId: string; clientId: string } | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsEntryId, setDetailsEntryId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { entryId: string; clientId: string };
      setUploadContext(detail);
      setUploadModalOpen(true);
    };
    (window as any).addEventListener('open-upload-justificatif', handler);
    return () => (window as any).removeEventListener('open-upload-justificatif', handler);
  }, []);

  // Fermer les modals internes si le parent se ferme
  useEffect(() => {
    const closeAll = () => {
      setUploadModalOpen(false);
      setUploadContext(null);
      setDetailsModalOpen(false);
      setDetailsEntryId(null);
    };
    window.addEventListener('close-all-modals', closeAll as any);
    return () => window.removeEventListener('close-all-modals', closeAll as any);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {isClientIdInvalid ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">Erreur de configuration</p>
            <p className="text-sm">Identifiant client manquant ou invalide</p>
          </div>
        </div>
      ) : (
        <>
      <ClientsLedgerHeader
        selectedPeriod={ledgerState.selectedPeriod}
        onPeriodChange={ledgerState.setSelectedPeriod}
        showAnalysis={ledgerState.showAnalysis}
        onToggleAnalysis={() =>
          ledgerState.setShowAnalysis(!ledgerState.showAnalysis)
        }
        selectedEntriesCount={ledgerState.selectedEntries.size}
        onBulkRequest={handleBulkRequestJustifications}
        isGenerating={justificationRequests.isGenerating}
        onImport={ledgerState.handleImport}
        analysisCount={
          analysisResult.unsolvedInvoices.length +
          analysisResult.paymentsWithoutJustification.length
        }
        onReload={ledgerState.reloadFromDb}
        onClear={ledgerState.clearForClient}
        sortBy={ledgerState.sortBy}
        onSortChange={ledgerState.setSortBy}
      />

      <div>
        {ledgerState.showAnalysis && (
          <AnalysisPanel
            analysisResult={analysisResult}
            llmSuggestions={ledgerState.llmSuggestions}
            onSelectEntries={ledgerState.setSelectedEntries}
            onGenerateSuggestions={generateLLMSuggestions}
          />
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {ledgerState.visibleEntries.length > 0 ? (
          <ModernLedgerDisplay
            entries={ledgerState.visibleEntries}
            type="clients"
            formatCurrency={ClientLedgerService.formatCurrency}
            formatDate={(date: Date | null) => date ? ClientLedgerService.formatDate(date) : ''}
            onEntryClick={(entry) => { setDetailsEntryId(entry._id); setDetailsModalOpen(true); }}
            getEntryStatus={getEntryStatus}
            onCommentAdd={(entryId, comment) => console.log('Comment added:', entryId, comment)}
            onEdit={(entry) => console.log('Edit entry:', entry)}
            onDelete={(entry) => console.log('Delete entry:', entry)}
            onExport={(entry) => console.log('Export entry:', entry)}
            onAddDocument={(entry) => { 
              (window as any).dispatchEvent(new CustomEvent('open-upload-justificatif', { 
                detail: { entryId: entry._id, clientId: entry.clientId } 
              })); 
            }}
          />
        ) : (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-medium mb-2">Aucune écriture trouvée</h3>
              <p className="text-sm">
                {ledgerState.searchTerm
                  ? "Aucune écriture ne correspond à votre recherche."
                  : "Importez un fichier CSV/Excel pour commencer."}
              </p>
            </div>
          </div>
        )}

        <JustificationRequestsPanel
          requests={justificationRequests.requests}
          entries={ledgerState.entries}
          onUpdateStatus={justificationRequests.updateRequestStatus}
          onRemoveRequest={justificationRequests.removeRequest}
          onShowNotification={showNotification}
        />

        {uploadModalOpen && uploadContext && (
          <UploadJustificatifModal
            isOpen={uploadModalOpen}
            onClose={() => setUploadModalOpen(false)}
            clientId={uploadContext.clientId}
            entryId={uploadContext.entryId}
            onUploaded={() => {
              ledgerState.markEntryAsJustified(uploadContext.entryId);
            }}
          />
        )}

        {detailsModalOpen && detailsEntryId && (
          <EntryDetailsModal
            isOpen={detailsModalOpen}
            onClose={() => setDetailsModalOpen(false)}
            entry={ledgerState.entries.find(e => e._id === detailsEntryId)!}
            formatCurrency={ClientLedgerService.formatCurrency}
            formatDate={ClientLedgerService.formatDate}
          />
        )}
      </div>
      </>
      )}
    </div>
  );
};
