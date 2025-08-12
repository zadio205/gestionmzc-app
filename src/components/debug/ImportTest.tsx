'use client';

import React, { useState } from 'react';
import FileImporter from '@/components/ui/FileImporter';

const ImportTest: React.FC = () => {
  const [importedData, setImportedData] = useState<any[]>([]);

  const handleImport = (data: any[]) => {
    console.log('Test - Données reçues:', data);
    setImportedData(data);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Test d'importation</h2>
      
      <FileImporter
        onImport={handleImport}
        expectedColumns={['N° Compte', 'Libellé', 'Débit', 'Crédit']}
        title="Test Import"
        description="Test de l'importation CSV"
        helpType="balance"
      />

      {importedData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Données importées :</h3>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(importedData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportTest;