"use client";

import React, { useEffect, useState } from "react";
import ClientsLedgerHeader from "./ClientsLedgerHeader";
import AnalysisPanel from "../AnalysisPanel";
import ClientLedgerTable from "./ClientLedgerTable";
import JustificationRequestsPanel from "./JustificationRequestsPanel";
import UploadJustificatifModal from "./UploadJustificatifModal";
import EntryDetailsModal from "@/components/clients/modal-pages/EntryDetailsModal";
import { SearchBar } from "./SearchBar";
import { useClientLedgerState } from "@/hooks/useClientLedgerState";
import { useJustificationRequests } from "@/hooks/useJustificationRequests";
import { useClientLedgerAnalysis } from "@/hooks/useClientLedgerAnalysis";
import { useNotification } from "@/contexts/NotificationContextSimple";
import LLMStatusIndicator from "@/components/ui/LLMStatusIndicator";

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
        const type = entry.credit > 0 ? "payment" : "invoice";
        await justificationRequests.requestJustification(entry, type);
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
            onGenerateSuggestions={generateLLMSuggestions}
          />
        )}

        {/* Indicateur de statut LLM */}
        <div className="mt-4">
          <LLMStatusIndicator className="max-w-md" />
        </div>

        {/* Info sur les données importées */}
  {ledgerState.entries.filter(e => e.isImported).length > 0 && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-green-700 font-medium">
    {ledgerState.entries.filter(e => e.isImported).length} entrée(s) importée(s) récemment
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ClientLedgerTable
            entries={ledgerState.filteredEntries}
            selectedEntries={ledgerState.selectedEntries}
            onToggleSelection={(entryId) => {
              const newSelection = new Set(ledgerState.selectedEntries);
              if (newSelection.has(entryId)) {
                newSelection.delete(entryId);
              } else {
                newSelection.add(entryId);
              }
              ledgerState.setSelectedEntries(newSelection);
            }}
            onSelectAll={(entries, selected) => {
              const newSelection = new Set(ledgerState.selectedEntries);
              if (selected) {
                entries.forEach((entry) => newSelection.add(entry._id));
              } else {
                entries.forEach((entry) =>
                  newSelection.delete(entry._id)
                );
              }
              ledgerState.setSelectedEntries(newSelection);
            }}
            onRequestJustification={
              justificationRequests.requestJustification
            }
            getEntryStatus={getEntryStatus}
            formatCurrency={ClientLedgerService.formatCurrency}
            formatDate={ClientLedgerService.formatDate}
            onViewDetails={(entry) => { setDetailsEntryId(entry._id); setDetailsModalOpen(true); }}
          />
        </div>

        {ledgerState.filteredEntries.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 mt-6">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium">Aucune écriture trouvée</p>
              <p className="text-sm">
                {ledgerState.searchTerm
                  ? "Aucune écriture ne correspond à votre recherche."
                  : "Aucune écriture client pour cette période."}
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
