import React from 'react';

interface SummaryCardsProps {
  summary: {
    totalDebit: number;
    totalCredit: number;
    totalBalance: number;
  };
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-blue-700">Total Débits</p>
        <p className="text-lg font-semibold text-blue-900">
          {formatCurrency(summary.totalDebit)}
        </p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-green-700">Total Crédits</p>
        <p className="text-lg font-semibold text-green-900">
          {formatCurrency(summary.totalCredit)}
        </p>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-purple-700">Solde</p>
        <p
          className={`text-lg font-semibold ${
            summary.totalBalance >= 0 ? "text-purple-900" : "text-red-600"
          }`}
        >
          {formatCurrency(Math.abs(summary.totalBalance))}
          {summary.totalBalance < 0 ? " (Créditeur)" : " (Débiteur)"}
        </p>
      </div>
    </div>
  );
};