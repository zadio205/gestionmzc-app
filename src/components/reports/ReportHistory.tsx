'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Brain,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2
} from 'lucide-react';
import { reportService, ReportData } from '@/services/reportService';

interface ReportHistoryProps {
  userRole: 'admin' | 'collaborateur';
  userId?: string;
}

const ReportHistory: React.FC<ReportHistoryProps> = ({ userRole, userId }) => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const history = await reportService.getReportHistory(userId);
        setReports(history);
      } catch (error) {
        console.error('Erreur chargement historique:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [userId]);

  const getStatusIcon = (status: ReportData['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'generating':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: ReportData['status']) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'generating':
        return 'En cours';
      case 'error':
        return 'Erreur';
      default:
        return 'Inconnu';
    }
  };

  const handleDownload = (report: ReportData) => {
    if (report.downloadUrl) {
      // Ici vous pourriez faire un appel API pour télécharger
      console.log('Téléchargement du rapport:', report.id);
      // Simulation du téléchargement
      window.open(report.downloadUrl, '_blank');
    }
  };

  const handleDelete = async (reportId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      setReports(prev => prev.filter(r => r.id !== reportId));
      // Ici vous feriez l'appel API pour supprimer
      console.log('Suppression du rapport:', reportId);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Historique des Rapports
        </h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Historique des Rapports
        </h3>
        <span className="text-sm text-gray-500">
          {reports.length} rapport{reports.length > 1 ? 's' : ''}
        </span>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun rapport généré</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors duration-200"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {report.title}
                    </h4>
                    {report.includeAI && (
                      <Brain className="w-4 h-4 text-purple-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(report.dateRange.start).toLocaleDateString('fr-FR')} - {new Date(report.dateRange.end).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(report.generatedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusIcon(report.status)}
                  <span className="text-sm text-gray-600">
                    {getStatusText(report.status)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => setSelectedReport(report)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Voir les détails"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                {report.status === 'completed' && (
                  <button
                    onClick={() => handleDownload(report)}
                    className="p-2 text-blue-600 hover:text-blue-800"
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => handleDelete(report.id)}
                  className="p-2 text-red-400 hover:text-red-600"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de détails du rapport */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Détails du Rapport
              </h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {selectedReport.title}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 font-medium">{selectedReport.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Statut:</span>
                    <span className="ml-2 font-medium">{getStatusText(selectedReport.status)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Généré le:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedReport.generatedAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">IA incluse:</span>
                    <span className="ml-2 font-medium">
                      {selectedReport.includeAI ? 'Oui' : 'Non'}
                    </span>
                  </div>
                </div>
              </div>
              
              {selectedReport.aiInsights && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h5 className="font-medium text-purple-900 mb-2 flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    Insights IA
                  </h5>
                  <p className="text-sm text-purple-800 mb-3">
                    {selectedReport.aiInsights.summary}
                  </p>
                  <div className="text-sm text-purple-700">
                    <strong>Recommandations:</strong> {selectedReport.aiInsights.recommendations.length}
                    <br />
                    <strong>Prédictions:</strong> {selectedReport.aiInsights.predictions.length}
                    <br />
                    <strong>Facteurs de risque:</strong> {selectedReport.aiInsights.riskFactors.length}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                {selectedReport.status === 'completed' && (
                  <button
                    onClick={() => handleDownload(selectedReport)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 inline mr-2" />
                    Télécharger
                  </button>
                )}
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportHistory;