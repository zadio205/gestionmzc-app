'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Copy, 
  Download, 
  Eye, 
  FileText, 
  Filter, 
  Link, 
  Mail,
  Printer,
  Settings,
  Share2
} from 'lucide-react';

interface ExportShareSystemProps {
  entries: any[];
  clientName: string;
  clientId: string;
  ledgerType: 'clients' | 'suppliers' | 'miscellaneous';
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | null) => string;
}

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'html';
  includeComments: boolean;
  includeAnalysis: boolean;
  includeJustifications: boolean;
  dateRange?: { start: Date; end: Date };
  statusFilter?: string[];
  customFields?: string[];
  template?: 'standard' | 'detailed' | 'summary';
}

const ExportShareSystem: React.FC<ExportShareSystemProps> = ({
  entries,
  clientName,
  clientId,
  ledgerType,
  formatCurrency,
  formatDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeComments: true,
    includeAnalysis: true,
    includeJustifications: false,
    template: 'standard'
  });
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Simulation de génération de rapport
      const reportData = {
        client: clientName,
        ledgerType,
        entries: entries.map(entry => ({
          ...entry,
          formattedDebit: entry.debit ? formatCurrency(entry.debit) : '',
          formattedCredit: entry.credit ? formatCurrency(entry.credit) : '',
          formattedDate: formatDate(entry.date),
          formattedBalance: formatCurrency(Math.abs(entry.balance)),
        })),
        summary: {
          totalEntries: entries.length,
          totalDebit: entries.reduce((sum, e) => sum + (e.debit || 0), 0),
          totalCredit: entries.reduce((sum, e) => sum + (e.credit || 0), 0),
          totalBalance: entries.reduce((sum, e) => sum + (e.balance || 0), 0),
        },
        exportOptions,
        generatedAt: new Date()
      };

      // TODO: Remplacer par appel API réel
      switch (exportOptions.format) {
        case 'pdf':
          await generatePDF(reportData);
          break;
        case 'excel':
          await generateExcel(reportData);
          break;
        case 'csv':
          await generateCSV(reportData);
          break;
        case 'html':
          await generateHTML(reportData);
          break;
      }
      
    } catch (error) {
      console.error('Erreur génération rapport:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = async (data: any) => {
    // TODO: Implémentation génération PDF avec jsPDF ou bibliothèque serveur
    console.log('Génération PDF:', data);
    
    // Simulation téléchargement
    const blob = new Blob(['Rapport PDF simulé'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grand-livre-${ledgerType}-${clientName}-${new Date().toISOString().split('T')[0]}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateExcel = async (data: any) => {
    // TODO: Implémentation avec xlsx ou ExcelJS
    const csvContent = generateCSVContent(data);
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grand-livre-${ledgerType}-${clientName}-${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateCSV = async (data: any) => {
    const csvContent = generateCSVContent(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grand-livre-${ledgerType}-${clientName}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateHTML = async (data: any) => {
    const htmlContent = generateHTMLContent(data);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grand-livre-${ledgerType}-${clientName}-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateCSVContent = (data: any) => {
    const headers = ['Date', 'Description', 'Débit', 'Crédit', 'Solde', 'Statut'];
    const rows = data.entries.map((entry: any) => [
      entry.formattedDate,
      entry.description || '',
      entry.formattedDebit,
      entry.formattedCredit,
      entry.formattedBalance,
      entry.status || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(';')).join('\n');
  };

  const generateHTMLContent = (data: any) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Grand Livre ${ledgerType} - ${clientName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            .summary { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Grand Livre ${ledgerType} - ${clientName}</h1>
          <div class="summary">
            <h3>Résumé</h3>
            <p>Total entrées: ${data.summary.totalEntries}</p>
            <p>Total débits: ${formatCurrency(data.summary.totalDebit)}</p>
            <p>Total crédits: ${formatCurrency(data.summary.totalCredit)}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Débit</th>
                <th>Crédit</th>
                <th>Solde</th>
              </tr>
            </thead>
            <tbody>
              ${data.entries.map((entry: any) => `
                <tr>
                  <td>${entry.formattedDate}</td>
                  <td>${entry.description || ''}</td>
                  <td>${entry.formattedDebit}</td>
                  <td>${entry.formattedCredit}</td>
                  <td>${entry.formattedBalance}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p><small>Généré le ${new Date().toLocaleString('fr-FR')}</small></p>
        </body>
      </html>
    `;
  };

  const generateShareableLink = async () => {
    // TODO: Générer un lien sécurisé temporaire
    const linkId = `${clientId}-${ledgerType}-${Date.now()}`;
    const url = `${window.location.origin}/shared-ledger/${linkId}`;
    setShareUrl(url);
    
    // Copier dans le presse-papiers
    try {
      await navigator.clipboard.writeText(url);
      // Notification copiée
    } catch (err) {
      console.error('Erreur copie presse-papiers:', err);
    }
  };

  const sendByEmail = () => {
    const subject = encodeURIComponent(`Grand livre ${ledgerType} - ${clientName}`);
    const body = encodeURIComponent(`
Bonjour,

Veuillez trouver ci-joint le grand livre ${ledgerType} pour ${clientName}.

${shareUrl ? `Lien de consultation: ${shareUrl}` : ''}

Cordialement,
L'équipe comptable
    `);
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (!isOpen) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Share2 className="w-4 h-4" />
          <span>Partager</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Exporter et partager le grand livre
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Options de format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format d'export
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'pdf', label: 'PDF', icon: FileText },
                  { value: 'excel', label: 'Excel', icon: Download },
                  { value: 'csv', label: 'CSV', icon: Download },
                  { value: 'html', label: 'HTML', icon: Eye }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setExportOptions(prev => ({ ...prev, format: value as any }))}
                    className={`flex flex-col items-center p-3 border rounded-lg ${
                      exportOptions.format === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modèle de rapport
              </label>
              <select
                value={exportOptions.template}
                onChange={(e) => setExportOptions(prev => ({ ...prev, template: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="standard">Standard</option>
                <option value="detailed">Détaillé</option>
                <option value="summary">Résumé</option>
              </select>
            </div>

            {/* Options d'inclusion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenu à inclure
              </label>
              <div className="space-y-2">
                {[
                  { key: 'includeComments', label: 'Commentaires et annotations' },
                  { key: 'includeAnalysis', label: 'Analyse IA et alertes' },
                  { key: 'includeJustifications', label: 'Justificatifs attachés' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions[key as keyof ExportOptions] as boolean}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions d'export */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGenerating ? 'Génération...' : 'Télécharger'}</span>
                </button>

                <button
                  onClick={sendByEmail}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Mail className="w-4 h-4" />
                  <span>Envoyer par email</span>
                </button>
              </div>
            </div>

            {/* Partage par lien */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Partage sécurisé</h4>
              <div className="flex space-x-2">
                <button
                  onClick={generateShareableLink}
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                >
                  <Link className="w-4 h-4" />
                  <span>Générer lien</span>
                </button>
                
                {shareUrl && (
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 p-2 text-xs border border-gray-300 rounded bg-gray-50"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(shareUrl)}
                      className="p-2 text-gray-600 hover:text-gray-800"
                      title="Copier"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {shareUrl && (
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Ce lien expirera dans 7 jours et nécessite une authentification
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportShareSystem;
