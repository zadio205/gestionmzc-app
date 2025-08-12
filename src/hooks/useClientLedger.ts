import { useState, useMemo, useCallback } from 'react';
import { ClientLedger } from '@/types/accounting';
import { AnalysisResult, LedgerSummary } from '@/types/ledger';
import { useClientLedgerAnalysis } from './useClientLedgerAnalysis';
import { llmService } from '@/services/llmService';

export const useClientLedger = (clientId: string) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("2024-01");
  const [importedEntries, setImportedEntries] = useState<ClientLedger[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [llmSuggestions, setLlmSuggestions] = useState<string[]>([]);

  const allEntries = useMemo(() => [...importedEntries], [importedEntries]);

  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return allEntries;
    
    const searchLower = searchTerm.toLowerCase();
    return allEntries.filter(
      (entry) =>
        entry.clientName.toLowerCase().includes(searchLower) ||
        entry.description.toLowerCase().includes(searchLower) ||
        entry.reference.toLowerCase().includes(searchLower)
    );
  }, [allEntries, searchTerm]);

  const analysisResult = useClientLedgerAnalysis(allEntries);

  const summary: LedgerSummary = useMemo(() => {
    const debit = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const credit = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
    return {
      totalDebit: debit,
      totalCredit: credit,
      totalBalance: debit - credit,
    };
  }, [filteredEntries]);

  const entriesByClient = useMemo(
    () =>
      filteredEntries.reduce((acc, entry) => {
        if (!acc[entry.clientName]) {
          acc[entry.clientName] = [];
        }
        acc[entry.clientName].push(entry);
        return acc;
      }, {} as Record<string, ClientLedger[]>),
    [filteredEntries]
  );

  const generateLLMSuggestions = useCallback(async (entries: ClientLedger[]) => {
    try {
      const suggestions = await llmService.generateImprovementSuggestions(entries);
      setLlmSuggestions(suggestions);
    } catch (error) {
      console.warn("Erreur génération suggestions LLM:", error);
    }
  }, []);

  const toggleEntrySelection = useCallback((entryId: string) => {
    setSelectedEntries(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(entryId)) {
        newSelection.delete(entryId);
      } else {
        newSelection.add(entryId);
      }
      return newSelection;
    });
  }, []);

  const selectMultipleEntries = useCallback((entryIds: Set<string>) => {
    setSelectedEntries(entryIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedEntries(new Set());
  }, []);

  return {
    // State
    searchTerm,
    selectedPeriod,
    importedEntries,
    selectedEntries,
    llmSuggestions,
    
    // Computed values
    allEntries,
    filteredEntries,
    analysisResult,
    summary,
    entriesByClient,
    
    // Actions
    setSearchTerm,
    setSelectedPeriod,
    setImportedEntries,
    generateLLMSuggestions,
    toggleEntrySelection,
    selectMultipleEntries,
    clearSelection,
  };
};