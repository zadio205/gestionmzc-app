import React from 'react';
import { Brain, FileText, XCircle } from 'lucide-react';
import { ClientLedger } from '@/types/accounting';
import { JustificationRequest } from '@/types/ledger';
import { ClientLedgerService } from '@/services/clientLedgerService';

interface JustificationRequestsPanelProps {
  requests: JustificationRequest[];
  entries: ClientLedger[];
  onUpdateStatus: (requestId: string, status: JustificationRequest['status']) => void;
  onRemoveRequest: (requestId: string) => void;
  onShowNotification: (notification: {
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    duration: number;
  }) => void;
}

const JustificationRequestsPanel: React.FC<JustificationRequestsPanelProps> = ({
  requests,
  entries,
  onUpdateStatus,
  onRemoveRequest,
  onShowNotification
}) => {
  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Demandes de justificatifs ({requests.length})
            </h3>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {requests.map((request) => {
            const entry = entries.find(e => e._id === request.entryId);
            if (!entry) return null;
            
            return (
              <div key={request.id} className="px-6 py-4 border-b border-gray-100 last:border-b-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        request.type === 'payment' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {request.type === 'payment' ? 'Encaissement' : 'Facture'}
                      </span>
                      {request.isLLMGenerated && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full font-medium flex items-center space-x-1">
                          <Brain className="w-3 h-3" />
                          <span>IA</span>
                        </span>
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {entry.clientName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {ClientLedgerService.formatCurrency(
                          request.type === 'payment' ? entry.credit : entry.debit
                        )}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {request.status === 'pending' ? 'En attente' :
                         request.status === 'sent' ? 'Envoyé' : 'Reçu'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {entry.date ? ClientLedgerService.formatDate(entry.date) : ''} - {entry.description}
                    </div>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        Voir le message généré {request.isLLMGenerated && '(par IA)'}
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded border text-gray-700 whitespace-pre-line">
                        {request.message}
                      </div>
                    </details>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        onUpdateStatus(request.id, 'sent');
                        onShowNotification({
                          type: 'success',
                          title: 'Demande envoyée',
                          message: `Demande envoyée à ${entry.clientName}`,
                          duration: 3000
                        });
                      }}
                      disabled={request.status !== 'pending'}
                      className={`px-3 py-1 text-xs rounded ${
                        request.status === 'pending'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {request.status === 'pending' ? 'Envoyer' : 'Envoyé'}
                    </button>
                    <button
                      onClick={() => onRemoveRequest(request.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Supprimer"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JustificationRequestsPanel;