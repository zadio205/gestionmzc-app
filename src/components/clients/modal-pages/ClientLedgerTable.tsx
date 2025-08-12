import React from 'react';
import { Mail, Eye, Upload } from 'lucide-react';
import { ClientLedger } from '@/types/accounting';
import { EntryStatus } from '@/types/ledger';

interface ClientLedgerTableProps {
  entries: ClientLedger[];
  selectedEntries: Set<string>;
  onToggleSelection: (entryId: string) => void;
  onSelectAll: (entries: ClientLedger[], selected: boolean) => void;
  onRequestJustification: (entry: ClientLedger, type: 'payment' | 'invoice') => void;
  getEntryStatus: (entry: ClientLedger) => EntryStatus;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
}

const ClientLedgerTable: React.FC<ClientLedgerTableProps> = ({
  entries,
  selectedEntries,
  onToggleSelection,
  onSelectAll,
  onRequestJustification,
  getEntryStatus,
  formatCurrency,
  formatDate
}) => {

  return (
    <div className="overflow-x-auto">
      <table 
        className="min-w-full divide-y divide-gray-200"
        role="table"
        aria-label="Grand livre des clients"
      >
    <thead className="bg-gray-50">
          <tr role="row">
            <th 
      className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"
              scope="col"
            >
              <input
                type="checkbox"
                checked={entries.every((entry) => selectedEntries.has(entry._id))}
                onChange={(e) => onSelectAll(entries, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label="Sélectionner toutes les écritures"
              />
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
              Date
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nom Client
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
              N° Compte
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Libellé
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider tabular-nums w-28">
              Débit
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider tabular-nums w-28">
              Crédit
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider tabular-nums w-28">
              Solde
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
              Statut
            </th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((entry) => {
            const isAmountEmpty = ((entry.debit || 0) === 0) && ((entry.credit || 0) === 0);
            const status = isAmountEmpty ? null : getEntryStatus(entry);
            const StatusIcon = status ? status.icon : null;
            
            return (
              <tr
                key={entry._id}
                className={`hover:bg-gray-50 ${
                  selectedEntries.has(entry._id) ? 'bg-blue-50' : ''
                } ${
                  entry.isImported ? 'border-l-4 border-green-400 bg-green-50' : ''
                }`}
              >
                <td className="px-2 py-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedEntries.has(entry._id)}
                    onChange={() => onToggleSelection(entry._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-28">
                  <div className="flex items-center">
                    {entry.isImported && (
                      <div
                        className="w-2 h-2 bg-green-500 rounded-full mr-2"
                        title="Données importées"
                      />
                    )}
                    {entry.date ? formatDate(entry.date) : ''}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {entry.clientName || ''}
          {entry.aiMeta && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                          entry.aiMeta.suspiciousLevel === 'high'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : entry.aiMeta.suspiciousLevel === 'medium'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}
            title={`Analyse IA: ${entry.aiMeta.suspiciousLevel}\n- ${entry.aiMeta.reasons.join('\n- ')}`}
                      >
                        IA {entry.aiMeta.suspiciousLevel}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-32">
                  {entry.accountNumber || ''}
                </td>
                <td className="px-3 py-2 text-sm text-gray-900 max-w-xs">
                  <div>
                    <div className="font-medium">
                      {entry.description || ''}
                    </div>
                    {entry.reference ? (
                      <div className="text-gray-500 text-xs">
                        Réf: {entry.reference}
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-right tabular-nums w-28">
                  {isAmountEmpty ? '' : (
                    entry.debit > 0 ? (
                      <span className="text-red-600 font-medium">
                        {formatCurrency(entry.debit)}
                      </span>
                    ) : ''
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-right tabular-nums w-28">
                  {isAmountEmpty ? '' : (
                    entry.credit > 0 ? (
                      <span className="text-green-600 font-medium">
                        {formatCurrency(entry.credit)}
                      </span>
                    ) : ''
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-right tabular-nums w-28">
                  {isAmountEmpty ? '' : (
                    <span
                      className={`font-medium ${
                        entry.balance >= 0 ? 'text-gray-900' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(Math.abs(entry.balance))}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap w-40">
                  {isAmountEmpty ? '' : (
                    <div className="flex items-center space-x-2">
                      {StatusIcon && (
                        <StatusIcon
                          className={`w-4 h-4 ${
                            status!.type === 'success'
                              ? 'text-green-500'
                              : status!.type === 'warning'
                              ? 'text-yellow-500'
                              : 'text-red-500'
                          }`}
                        />
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          status!.type === 'success'
                            ? 'bg-green-100 text-green-800'
                            : status!.type === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {status!.label}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center w-28">
                  {isAmountEmpty ? '' : (
                    <div className="flex items-center justify-center space-x-2">
                      {status && status.label === 'Justificatif manquant' && (
                        <button
                          onClick={() => onRequestJustification(entry, entry.credit > 0 ? 'payment' : 'invoice')}
                          className="text-amber-600 hover:text-amber-800 p-1 rounded"
                          title="Demander justificatif"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      )}
                      {status && status.label === 'Justificatif manquant' && (
                        <button
                          onClick={() => (window as any).dispatchEvent(new CustomEvent('open-upload-justificatif', { detail: { entryId: entry._id, clientId: entry.clientId } }))}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                          title="Ajouter justificatif"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="text-gray-600 hover:text-gray-800 p-1 rounded"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ClientLedgerTable;