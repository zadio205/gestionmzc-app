'use client';

import React, { useState } from 'react';
import { X, Brain, CheckCircle, AlertTriangle, ExternalLink, Download } from 'lucide-react';

interface LLMHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LLMHelpModal: React.FC<LLMHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Intelligence Artificielle dans Masyzarac
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Introduction */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Qu'est-ce que l'IA dans Masyzarac ?
            </h3>
            <p className="text-blue-800">
              L'intelligence artificielle améliore votre expérience comptable en générant 
              automatiquement des messages professionnels, en analysant les écritures 
              suspectes et en proposant des améliorations personnalisées.
            </p>
          </div>

          {/* Fonctionnalités */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Fonctionnalités IA disponibles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-900">Messages automatiques</h4>
                </div>
                <p className="text-sm text-green-800">
                  Génération de demandes de justificatifs personnalisées et professionnelles
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-medium text-yellow-900">Analyse d'écritures</h4>
                </div>
                <p className="text-sm text-yellow-800">
                  Détection automatique d'anomalies et d'écritures suspectes
                </p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium text-purple-900">Suggestions</h4>
                </div>
                <p className="text-sm text-purple-800">
                  Recommandations pour améliorer la qualité de la saisie comptable
                </p>
              </div>
            </div>
          </div>

          {/* Modes de fonctionnement */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Modes de fonctionnement
            </h3>
            
            <div className="space-y-4">
              {/* Mode optimal */}
              <div className="border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h4 className="font-semibold text-green-900">Mode optimal (Ollama)</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Recommandé
                  </span>
                </div>
                <div className="ml-6 space-y-2">
                  <p className="text-sm text-gray-700">
                    ✅ IA locale gratuite et privée<br/>
                    ✅ Messages personnalisés de haute qualité<br/>
                    ✅ Analyse avancée des écritures<br/>
                    ✅ Aucune donnée envoyée vers l'extérieur
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Download className="w-4 h-4 text-green-600" />
                    <a
                      href="/OLLAMA_SETUP.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Guide d'installation Ollama
                    </a>
                    <ExternalLink className="w-3 h-3 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Mode cloud */}
              <div className="border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <h4 className="font-semibold text-yellow-900">Mode cloud</h4>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Payant
                  </span>
                </div>
                <div className="ml-6 space-y-2">
                  <p className="text-sm text-gray-700">
                    ⚡ OpenAI GPT (nécessite OPENAI_API_KEY)<br/>
                    🤗 Hugging Face (nécessite HUGGING_FACE_TOKEN)<br/>
                    💰 Services payants ou limités<br/>
                    🌐 Données envoyées vers des serveurs externes
                  </p>
                </div>
              </div>

              {/* Mode dégradé */}
              <div className="border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <h4 className="font-semibold text-red-900">Mode dégradé (actuel)</h4>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    Limité
                  </span>
                </div>
                <div className="ml-6 space-y-2">
                  <p className="text-sm text-gray-700">
                    📝 Templates prédéfinis pour les messages<br/>
                    🔍 Analyse locale basique<br/>
                    💡 Suggestions génériques<br/>
                    ⚠️ Qualité réduite mais fonctionnel
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Installation rapide */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Installation rapide d'Ollama (recommandé)
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                <div># macOS/Linux</div>
                <div>curl -fsSL https://ollama.ai/install.sh | sh</div>
                <div className="mt-2"># Démarrer le service</div>
                <div>ollama serve</div>
                <div className="mt-2"># Télécharger un modèle</div>
                <div>ollama pull llama2</div>
              </div>
              <p className="text-sm text-gray-600">
                Une fois installé, redémarrez Masyzarac pour bénéficier automatiquement 
                de l'IA locale.
              </p>
            </div>
          </div>

          {/* Sécurité et confidentialité */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              🔒 Sécurité et confidentialité
            </h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Ollama fonctionne entièrement sur votre machine</li>
              <li>• Aucune donnée comptable n'est envoyée vers l'extérieur</li>
              <li>• Respect total du RGPD et de la confidentialité</li>
              <li>• Contrôle complet de vos données sensibles</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Pour plus d'informations, consultez le guide d'installation complet.
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="/OLLAMA_SETUP.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>Guide complet</span>
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMHelpModal;