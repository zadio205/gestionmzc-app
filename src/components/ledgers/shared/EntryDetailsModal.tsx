import React, { useEffect, useState } from 'react';
import { X, Eye, AlertTriangle, BadgeCheck, Download, RefreshCw } from 'lucide-react';
import type { ClientLedger } from '@/types/accounting';

interface EntryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: ClientLedger;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
}

const EntryDetailsModal: React.FC<EntryDetailsModalProps> = ({ isOpen, onClose, entry, formatCurrency, formatDate }) => {
  const isCredit = (entry.credit || 0) > 0;
  const isDebit = (entry.debit || 0) > 0;

  const [files, setFiles] = useState<Array<{ name: string; url?: string; path: string; size?: number | null; createdAt?: string | null }>>([]);
  const [loading, setLoading] = useState(false);

  const loadFiles = async () => {
    if (!entry?.clientId || !entry?._id) return;
    try {
      setLoading(true);
      const res = await fetch('/api/documents/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: entry.clientId, entryId: entry._id })
      });
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (e) {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?._id, entry?.clientId]);

  if (!isOpen) return null;

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

        {/* Pièces jointes */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-500">Pièces jointes</div>
            <button onClick={loadFiles} className="text-xs inline-flex items-center gap-1 text-gray-600 hover:text-gray-900">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
          {files.length === 0 ? (
            <div className="text-sm text-gray-500">Aucun fichier joint pour cette écriture.</div>
          ) : (
            <ul className="divide-y divide-gray-100 rounded border border-gray-100">
              {files.map((f) => (
                <li key={f.path} className="px-3 py-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{f.name}</div>
                    <div className="text-xs text-gray-500">{f.createdAt ? new Date(f.createdAt).toLocaleString('fr-FR') : ''}</div>
                  </div>
                  {f.url && (
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
                      <Download className="w-4 h-4" /> Télécharger
                    </a>
                  )}
                </li>
              ))}
            </ul>
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
