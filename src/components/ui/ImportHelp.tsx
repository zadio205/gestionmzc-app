'use client';

import React, { useState } from 'react';
import { Download, FileText, HelpCircle, X } from 'lucide-react';

interface ImportHelpProps {
  type: 'balance' | 'clients' | 'suppliers' | 'miscellaneous';
}

const ImportHelp: React.FC<ImportHelpProps> = ({ type }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getExampleData = () => {
    switch (type) {
      case 'balance':
        return {
          title: 'Balance générale',
          filename: 'balance-exemple.csv',
          columns: ['N° Compte', 'Libellé', 'Débit', 'Crédit'],
          example: [
            ['101000', 'Capital social', '0', '50000'],
            ['411000', 'Clients', '25000', '0'],
            ['401000', 'Fournisseurs', '0', '15000'],
            ['512000', 'Banque', '30000', '0']
          ]
        };
      case 'clients':
        return {
          title: 'Grand livre des clients',
          filename: 'clients-exemple.csv',
          columns: ['Date', 'Nom Client', 'Description', 'Référence', 'Débit', 'Crédit'],
          example: [
            ['2024-01-05', 'Client ABC', 'Facture de prestation', 'FAC-2024-001', '1200', '0'],
            ['2024-01-10', 'Client ABC', 'Règlement chèque', 'REG-001', '0', '1200'],
            ['2024-01-15', 'Client XYZ', 'Facture de conseil', 'FAC-2024-002', '2500', '0']
          ]
        };
      case 'suppliers':
        return {
          title: 'Grand livre des fournisseurs',
          filename: 'fournisseurs-exemple.csv',
          columns: ['Date', 'Nom Fournisseur', 'Description', 'Référence', 'Débit', 'Crédit'],
          example: [
            ['2024-01-03', 'Fournisseur Alpha', 'Fournitures bureau', 'FALP-001', '0', '450'],
            ['2024-01-08', 'Fournisseur Alpha', 'Règlement facture', 'REG-FALP-001', '450', '0'],
            ['2024-01-12', 'Fournisseur Beta', 'Matériel informatique', 'FBET-002', '0', '1200']
          ]
        };
      case 'miscellaneous':
        return {
          title: 'Grand livre des comptes divers',
          filename: 'comptes-divers-exemple.csv',
          columns: ['Date', 'N° Compte', 'Libellé', 'Description', 'Référence', 'Débit', 'Crédit', 'Catégorie'],
          example: [
            ['2024-01-02', '512000', 'Banque', 'Virement initial capital', 'VIR-001', '50000', '0', 'Banque'],
            ['2024-01-05', '606000', 'Achats non stockés', 'Fournitures de bureau', 'ACH-001', '150', '0', 'Achats'],
            ['2024-01-08', '613000', 'Locations', 'Loyer janvier 2024', 'LOY-001', '1200', '0', 'Charges']
          ]
        };
      default:
        return null;
    }
  };

  const downloadExample = () => {
    const data = getExampleData();
    if (!data) return;

    const csvContent = [
      data.columns.join(','),
      ...data.example.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', data.filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const data = getExampleData();
  if (!data) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
        title="Aide à l'importation"
      >
        <HelpCircle className="w-3 h-3" />
        <span>Aide</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Format d'importation - {data.title}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto">
              <div className="space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Préparez votre fichier CSV avec les colonnes exactes ci-dessous</li>
                    <li>• Utilisez des virgules comme séparateurs</li>
                    <li>• Les montants doivent être des nombres (utilisez des points pour les décimales)</li>
                    <li>• Les dates doivent être au format YYYY-MM-DD</li>
                  </ul>
                </div>

                {/* Colonnes requises */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Colonnes requises</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {data.columns.map((column, index) => (
                      <div key={index} className="bg-gray-100 px-3 py-2 rounded text-sm font-medium text-gray-700">
                        {column}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exemple de données */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Exemple de données</h4>
                    <button
                      onClick={downloadExample}
                      className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <Download className="w-4 h-4" />
                      <span>Télécharger l'exemple</span>
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {data.columns.map((column, index) => (
                            <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.example.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Format CSV */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Format CSV correspondant</h4>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                      {[data.columns.join(','), ...data.example.map(row => row.join(','))].join('\n')}
                    </pre>
                  </div>
                </div>

                {/* Conseils */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Conseils</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Testez avec quelques lignes avant d'importer un gros fichier</li>
                    <li>• Vérifiez que vos données sont cohérentes</li>
                    <li>• Sauvegardez vos données avant l'importation</li>
                    <li>• Les données importées seront marquées visuellement</li>
                    <li>• En cas de problème, ouvrez la console du navigateur (F12) pour voir les détails</li>
                  </ul>
                </div>

                {/* Dépannage */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">Problèmes d'importation ?</h4>
                  <p className="text-sm text-red-800 mb-2">
                    Si vos données ne s'affichent pas correctement :
                  </p>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Vérifiez que les noms de colonnes correspondent exactement</li>
                    <li>• Utilisez des points (.) pour les décimales, pas des virgules</li>
                    <li>• Sauvegardez en UTF-8 si vous avez des caractères spéciaux</li>
                    <li>• Consultez la console du navigateur (F12) pour les détails d'erreur</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportHelp;