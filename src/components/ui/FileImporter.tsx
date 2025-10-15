'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Check, AlertCircle } from 'lucide-react';
import ImportHelp from './ImportHelp';
import type { ImportedRow as SharedImportedRow } from '@/types/accounting';
import { useNotification } from '@/contexts/NotificationContextSimple';

interface ImportedRow {
  index: number;
  data: Record<string, string>;
  isValid: boolean;
  errors?: string[];
}

interface FileImporterProps {
  onImport: (data: SharedImportedRow[]) => void;
  expectedColumns: string[];
  title: string;
  description: string;
  acceptedFormats?: string[];
  helpType?: 'balance' | 'clients' | 'suppliers' | 'miscellaneous';
}

const FileImporter: React.FC<FileImporterProps> = ({
  onImport,
  expectedColumns,
  title,
  description,
  acceptedFormats = ['.csv'],
  helpType
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();
  // Méta de l’analyse courante
  const lastMetaRef = useRef<{
    headers: string[];
    foundColumns: string[];
    separator: ',' | ';';
    totalRows: number;
    validRows: number;
    invalidRows: number;
    fileName: string;
  } | null>(null);
  const lastSeparatorRef = useRef<',' | ';' | null>(null);
  const [summaryMeta, setSummaryMeta] = useState<null | {
    headers: string[];
    foundColumns: string[];
    separator: ',' | ';';
    totalRows: number;
    validRows: number;
    invalidRows: number;
    fileName: string;
  }>(null);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const data = await parseFile(file);

      // Vérifications de base avant import
      const meta = lastMetaRef.current;
      if (!meta) {
        setError('Analyse du fichier indisponible');
        showNotification({ type: 'error', title: 'Erreur import', message: 'Analyse du fichier indisponible.', duration: 5000 });
        return;
      }
      if (meta.totalRows === 0) {
        setError('Aucune ligne de données trouvée');
        showNotification({ type: 'warning', title: 'Aucune donnée', message: 'Aucune ligne de données détectée dans le fichier.', duration: 5000 });
        return;
      }
      if (meta.foundColumns.length === 0) {
        // Ne pas bloquer l'import: certaines colonnes peuvent être mappées plus tard (normalisation côté hook)
        showNotification({ type: 'warning', title: 'Colonnes non reconnues', message: `Aucune colonne attendue détectée exactement. Tentative d'import avec mappage souple.`, duration: 7000 });
      }

      // Import direct
      onImport(data);

      // Notifications de résumé
      const { validRows, totalRows, invalidRows, separator, foundColumns } = meta;
      showNotification({
        type: 'success',
        title: 'Import terminé',
        message: `${validRows}/${totalRows} ligne${totalRows > 1 ? 's' : ''} valides • Séparateur: "${separator}" • Colonnes reconnues: ${foundColumns.length}/${expectedColumns.length}`,
        duration: 6000,
      });
      if (invalidRows > 0) {
        showNotification({
          type: 'warning',
          title: 'Lignes ignorées',
          message: `${invalidRows} ligne${invalidRows > 1 ? 's' : ''} invalide${invalidRows > 1 ? 's' : ''} détectée${invalidRows > 1 ? 's' : ''}.`,
          duration: 5000,
        });
      }
  // Laisser le modal ouvert pour afficher le bandeau récapitulatif
  setSummaryMeta(meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier');
      showNotification({ type: 'error', title: 'Erreur import', message: err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier', duration: 6000 });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseFile = async (file: File): Promise<SharedImportedRow[]> => {
    // Normalise un en-tête: supprime BOM, espaces insécables, trim et réduit les espaces
    const normalizeHeader = (header: string) =>
      String(header || '')
        .replace(/^\uFEFF/, '') // BOM en début de fichier
        .replace(/[\u00A0\t]+/g, ' ') // espaces insécables/onglets -> espace
        .replace(/\s+/g, ' ') // espaces multiples -> simple
        .trim();

    return new Promise((resolve, reject) => {
      const readText = (encoding?: string) => new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = () => rej(new Error('Erreur lors de la lecture du fichier'));
        if (encoding) r.readAsText(file, encoding); else r.readAsText(file);
      });

      (async () => {
        try {
          // Lecture initiale en UTF-8
          let content = await readText('UTF-8');
          // Heuristique: si caractères de remplacement présents (�) dans l’en-tête, retenter en windows-1252
          const sniff = content.slice(0, 4096);
          if (/[\uFFFD]|N�|D�bit|Cr�dit|Libell�/i.test(sniff)) {
            try {
              content = await readText('windows-1252');
            } catch {
              // ignorer, on restera sur UTF-8
            }
          }

          let rows: string[][];
          if (file.name.endsWith('.csv')) {
            rows = parseCSV(content);
          } else {
            reject(new Error('Format Excel non supporté. Merci d’utiliser un fichier CSV (.csv).'));
            return;
          }

          const [rawHeaders, ...dataRows] = rows;
          // Normaliser les en-têtes une seule fois
          const headers = rawHeaders.map(normalizeHeader);
          console.log('🔍 Headers bruts trouvés:', headers);
          console.log('🔍 Headers avec index:', headers.map((h, i) => `${i}: "${h}"`));
          console.log('🔍 Lignes de données brutes:', dataRows);
          console.log('🔍 Première ligne de données:', dataRows[0]);
          
          // Validation globale des headers (une seule fois)
          const globalErrors: string[] = [];
          
          // Vérifier si au moins une colonne attendue est présente (normalisation souple: casse/accents/espaces)
          const norm = (s: string) => String(s || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/\s+/g, ' ')
            .trim();
          const headersNorm = headers.map(norm);
          const expectedNorm = expectedColumns.map(norm);
          const foundColumns = expectedColumns.filter((col, idx) => {
            const colNorm = expectedNorm[idx];
            return headersNorm.some(h => h === colNorm || h.includes(colNorm) || colNorm.includes(h));
          });
          
          console.log('🔍 Colonnes attendues:', expectedColumns);
          console.log('🔍 Colonnes trouvées:', foundColumns);
          
          // Ne pas invalider globalement si aucune colonne attendue n'est reconnue;
          // on laisse le hook faire un mappage souple côté client.
          
          const processedData: SharedImportedRow[] = dataRows.map((row, index) => {
            const rowData: Record<string, string> = {};
            const errors: string[] = [...globalErrors]; // Copier les erreurs globales

            headers.forEach((header, colIndex) => {
              // Conserver les mêmes clés normalisées que headers
              const cell = row[colIndex] ?? '';
              rowData[header] = String(cell).trim();
            });
            
            console.log(`🔍 Ligne ${index + 1} détaillée:`, {
              index: index + 1,
              rawRow: row,
              mappedData: rowData,
              headerMapping: headers.map((h, i) => `"${h}" = "${row[i]}"`)
            });

            // Validation spécifique à la ligne (données vides, etc.)
            const hasData = Object.values(rowData).some(value => String(value).trim() !== '');
            if (!hasData) {
              errors.push('Ligne vide');
            }

            return {
              index: index + 1,
              data: rowData,
              isValid: errors.length === 0,
              errors: errors.length > 0 ? errors : undefined
            };
          });

          // Renseigner la méta pour les notifications
          const totalRows = dataRows.length;
          const validRows = processedData.filter(r => r.isValid).length;
          const invalidRows = totalRows - validRows;
          lastMetaRef.current = {
            headers,
            foundColumns,
            separator: lastSeparatorRef.current || ',',
            totalRows,
            validRows,
            invalidRows,
            fileName: file.name,
          };

          resolve(processedData);
        } catch (err) {
          reject(new Error('Erreur lors du parsing du fichier'));
        }
      })();
    });
  };

  const parseCSV = (content: string): string[][] => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];

    // Détecter le séparateur une fois sur la première ligne (en-têtes), en ignorant les virgules décimales entre guillemets
    const detectSeparator = (line: string): ',' | ';' => {
      let inQuotes = false;
      let commaCount = 0;
      let semicolonCount = 0;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          // Gérer les guillemets échappés
          if (inQuotes && line[i + 1] === '"') {
            i++;
            continue;
          }
          inQuotes = !inQuotes;
        } else if (!inQuotes) {
          if (ch === ',') commaCount++;
          else if (ch === ';') semicolonCount++;
        }
      }
      // S'il y a plus de ; que de , on choisit ;, sinon ,
      const sep: ',' | ';' = semicolonCount > commaCount ? ';' : ',';
      console.log(`🔍 Séparateur détecté (en-tête): "${sep}" (","=${commaCount}, ";"=${semicolonCount})`);
      return sep;
    };

  const separator = detectSeparator(lines[0]);
  lastSeparatorRef.current = separator;
    
    return lines
      .map(line => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++; // skip next quote
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === separator && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/^"|"$/g, ''));
        console.log(`🔍 Ligne parsée: [${result.map(r => `"${r}"`).join(', ')}]`);
        return result;
      })
      .filter(row => row.some(cell => cell.trim() !== ''));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && isValidFileType(file)) {
      handleFileSelect(file);
    } else {
      setError('Type de fichier non supporté');
    }
  };

  const isValidFileType = (file: File): boolean => {
    return acceptedFormats.some(format => file.name.toLowerCase().endsWith(format));
  };

  const handleCancel = () => {
    setIsOpen(false);
    setError(null);
  };

  if (!isOpen) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Importer</span>
        </button>
        {helpType && <ImportHelp type={helpType} />}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Glissez votre fichier ici ou cliquez pour sélectionner
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Formats acceptés: {acceptedFormats.join(', ')}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Colonnes attendues: {expectedColumns.join(', ')}
            </p>
            {summaryMeta && (
              <div className="text-left mt-4 p-4 border rounded-md bg-gray-50 border-gray-200">
                <div className="flex items-center mb-2">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Résumé de l’analyse</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                  <div><span className="text-gray-500">Fichier:</span> {summaryMeta.fileName}</div>
                  <div><span className="text-gray-500">Séparateur:</span> "{summaryMeta.separator}"</div>
                  <div><span className="text-gray-500">Lignes:</span> {summaryMeta.validRows}/{summaryMeta.totalRows} valides</div>
                  <div><span className="text-gray-500">Colonnes reconnues:</span> {summaryMeta.foundColumns.length}/{expectedColumns.length}</div>
                </div>
                {summaryMeta.invalidRows > 0 && (
                  <div className="flex items-center mt-2 text-sm text-yellow-700">
                    <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
                    {summaryMeta.invalidRows} ligne{summaryMeta.invalidRows > 1 ? 's' : ''} ignorée{summaryMeta.invalidRows > 1 ? 's' : ''}
                  </div>
                )}
                {summaryMeta.foundColumns.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="text-gray-500">Colonnes:</span> {summaryMeta.foundColumns.join(', ')}
                  </div>
                )}
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
            
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? 'Traitement...' : 'Sélectionner un fichier'}
              </button>
              {summaryMeta && (
                <button
                  onClick={() => setSummaryMeta(null)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
                  title="Effacer le résumé"
                >
                  Effacer le résumé
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileImporter;