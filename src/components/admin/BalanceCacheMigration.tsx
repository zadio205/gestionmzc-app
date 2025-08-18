"use client";

import React, { useState, useEffect } from 'react';
import { Database, Download, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { runBalanceCacheMigration, cleanupLocalStorageAfterMigration, checkIfMigrationNeeded } from '@/utils/balanceCacheMigration';
import { useNotification } from '@/contexts/NotificationContextSimple';

interface BalanceCacheMigrationProps {
  onMigrationComplete?: () => void;
}

const BalanceCacheMigration: React.FC<BalanceCacheMigrationProps> = ({ onMigrationComplete }) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    setMigrationNeeded(checkIfMigrationNeeded());
  }, []);

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      await runBalanceCacheMigration();
      setMigrationComplete(true);
      setMigrationNeeded(false);
      showNotification({
        type: 'success',
        title: 'Migration réussie',
        message: 'Les données de balance ont été migrées vers Supabase avec succès.',
        duration: 5000,
      });
      onMigrationComplete?.();
    } catch (error) {
      console.error('Erreur de migration:', error);
      showNotification({
        type: 'error',
        title: 'Erreur de migration',
        message: 'Une erreur est survenue lors de la migration des données.',
        duration: 5000,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleCleanup = () => {
    try {
      cleanupLocalStorageAfterMigration();
      showNotification({
        type: 'info',
        title: 'Nettoyage terminé',
        message: 'Les anciennes données localStorage ont été supprimées.',
        duration: 3000,
      });
      setMigrationNeeded(false);
    } catch (error) {
      console.error('Erreur de nettoyage:', error);
      showNotification({
        type: 'warning',
        title: 'Erreur de nettoyage',
        message: 'Une erreur est survenue lors du nettoyage des données.',
        duration: 3000,
      });
    }
  };

  if (!migrationNeeded && !migrationComplete) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm">Aucune migration nécessaire</span>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Database className="h-6 w-6 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900">
            Migration du cache de balance
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            {migrationNeeded && !migrationComplete && (
              "Des données de balance sont stockées en local. Migrez-les vers Supabase pour éviter leur perte."
            )}
            {migrationComplete && (
              "Migration terminée ! Vous pouvez maintenant nettoyer les anciennes données locales."
            )}
          </p>
          
          <div className="flex space-x-2 mt-3">
            {migrationNeeded && !migrationComplete && (
              <button
                onClick={handleMigration}
                disabled={isMigrating}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMigrating ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Migration en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Migrer vers Supabase
                  </>
                )}
              </button>
            )}
            
            {migrationComplete && (
              <button
                onClick={handleCleanup}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Nettoyer localStorage
              </button>
            )}
          </div>
          
          {migrationNeeded && (
            <div className="flex items-center space-x-2 mt-2 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">
                Attention : Les données localStorage peuvent être perdues lors du nettoyage du navigateur
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceCacheMigration;
