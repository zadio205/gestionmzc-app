import { useState, useCallback } from 'react';
import { ClientLedger } from '@/types/accounting';
import { JustificationRequest } from '@/types/ledger';
import { llmService, AnalysisContext } from '@/services/llmService';
import { ClientLedgerService } from '@/services/clientLedgerService';
import { useNotification } from '@/contexts/NotificationContextSimple';

export const useJustificationRequests = () => {
  const [requests, setRequests] = useState<JustificationRequest[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { showNotification } = useNotification();

  // Use centralized formatting functions
  const formatDate = ClientLedgerService.formatDate;

  const generateFallbackMessage = (entry: ClientLedger, type: 'payment' | 'invoice') => {
    return ClientLedgerService.generateFallbackMessage(entry, type);
  };

  const generateJustificationMessage = useCallback(async (entry: ClientLedger, type: 'payment' | 'invoice') => {
    const context: AnalysisContext = {
      clientName: entry.clientName,
      amount: type === 'payment' ? entry.credit : entry.debit,
  date: entry.date ? formatDate(entry.date) : '',
      description: entry.description,
      reference: entry.reference,
      type
    };

    try {
      setIsGenerating(true);
      const message = await llmService.generateJustificationMessage(context);
      return { message, isLLMGenerated: true };
    } catch (error) {
      console.warn('Erreur génération message LLM, utilisation template:', error);
      return { message: generateFallbackMessage(entry, type), isLLMGenerated: false };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const requestJustification = async (entry: ClientLedger, type: 'payment' | 'invoice') => {
    const { message, isLLMGenerated } = await generateJustificationMessage(entry, type);
    const newRequest: JustificationRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      entryId: entry._id,
      type,
      status: 'pending',
      message,
      createdAt: new Date(),
      isLLMGenerated
    };
    
    setRequests(prev => [...prev, newRequest]);
    showNotification({
      type: 'success',
      title: isLLMGenerated ? 'Demande générée par IA' : 'Demande générée',
      message: `Demande de justificatif ${isLLMGenerated ? 'intelligente ' : ''}générée pour ${entry.clientName}`,
      duration: 3000
    });
  };

  const updateRequestStatus = (requestId: string, status: JustificationRequest['status']) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status } : req
      )
    );
  };

  const removeRequest = (requestId: string) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
  };

  return {
    requests,
    isGenerating,
    requestJustification,
    updateRequestStatus,
    removeRequest
  };
};