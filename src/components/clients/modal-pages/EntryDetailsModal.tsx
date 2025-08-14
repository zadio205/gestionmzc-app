import React from 'react';
import { X, Eye, AlertTriangle, BadgeCheck } from 'lucide-react';
import type { ClientLedger } from '@/types/accounting';

interface EntryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: ClientLedger;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
}

const EntryDetailsModal: React.FC<EntryDetailsModalProps> = ({ isOpen, onClose, entry, formatCurrency, formatDate }) => {
  if (!isOpen) return null;

  const isCredit = (entry.credit || 0) > 0;
  const isDebit = (entry.debit || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5" /> Détails de l'écriture
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" aria-label="Fermer">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-gray-500">Date</div>
              <div className="font-medium">{entry.date ? formatDate(entry.date) : '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">Référence</div>
              <div className="font-medium">{entry.reference || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">Client</div>
              <div className="font-medium">{entry.clientName || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">Compte</div>
              <div className="font-medium">{entry.accountNumber} — {entry.accountName}</div>
            </div>
          </div>

          <div>
            <div className="text-gray-500">Libellé</div>
            <div className="font-medium break-words">{entry.description || '-'}</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-gray-500">Débit</div>
              <div className={`font-semibold ${isDebit ? 'text-red-600' : 'text-gray-900'}`}>{entry.debit ? formatCurrency(entry.debit) : '0'}</div>
            </div>
            <div>
              <div className="text-gray-500">Crédit</div>
              <div className={`font-semibold ${isCredit ? 'text-green-600' : 'text-gray-900'}`}>{entry.credit ? formatCurrency(entry.credit) : '0'}</div>
            </div>
            <div>
              <div className="text-gray-500">Solde</div>
              <div className="font-semibold text-gray-900">{formatCurrency(Math.abs(entry.balance || 0))}</div>
            </div>
          </div>

          {entry.aiMeta && (
            <div className={`rounded-lg p-3 border ${entry.aiMeta.suspiciousLevel === 'high' ? 'bg-red-50 border-red-200' : entry.aiMeta.suspiciousLevel === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {entry.aiMeta.suspiciousLevel === 'high' ? (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                ) : (
                  <BadgeCheck className={`w-4 h-4 ${entry.aiMeta.suspiciousLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'}`} />
                )}
                <span className="text-sm font-medium">Analyse IA: {entry.aiMeta.suspiciousLevel}</span>
              </div>
              <div className="text-sm text-gray-700">
                <div className="font-medium mb-1">Raisons:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {entry.aiMeta.reasons.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
                {entry.aiMeta.suggestions?.length ? (
                  <>
                    <div className="font-medium mt-2 mb-1">Suggestions:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {entry.aiMeta.suggestions.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Fermer</button>
        </div>
      </div>
    </div>
  );
};

export default EntryDetailsModal;
