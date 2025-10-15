'use client';

import React from 'react';
import { Calendar, DollarSign, FileText, User, X } from 'lucide-react';

interface Entry {
  _id: string;
  date: Date | string | null;
  label?: string;
  debit: number;
  credit: number;
  balance?: number;
  reference?: string;
  description?: string;
  clientName?: string;
  // Support pour ClientLedger
  accountName?: string;
  accountNumber?: string;
}

interface EntryDetailsModalProps {
  entry: Entry | null;
  isOpen: boolean;
  onClose: () => void;
  formatCurrency?: (amount: number) => string;
  formatDate?: (date: Date) => string;
}

const EntryDetailsModal: React.FC<EntryDetailsModalProps> = ({ 
  entry, 
  isOpen, 
  onClose, 
  formatCurrency: providedFormatCurrency,
  formatDate: providedFormatDate 
}) => {
  if (!isOpen || !entry) return null;

  const formatCurrency = providedFormatCurrency || ((amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  });

  const formatDate = (date: Date | string | null): string => {
    if (!date) return 'N/A';
    if (providedFormatDate && date instanceof Date) {
      return providedFormatDate(date);
    }
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR').format(dateObj);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Détails de l'écriture
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(entry.date)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium">{entry.clientName || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Référence</p>
                  <p className="font-medium">{entry.reference || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Montants */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Montants</h3>
              
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-500">Débit</p>
                  <p className="font-medium text-green-600">{formatCurrency(entry.debit)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm text-gray-500">Crédit</p>
                  <p className="font-medium text-red-600">{formatCurrency(entry.credit)}</p>
                </div>
              </div>

              {typeof entry.balance !== 'undefined' && (
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-500">Solde</p>
                    <p className={`font-medium ${entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(entry.balance)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {entry.description && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{entry.description}</p>
              </div>
            </div>
          )}

          {/* Libellé */}
          {(entry.label || entry.accountName) && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Libellé</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{entry.label || entry.accountName || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntryDetailsModal;