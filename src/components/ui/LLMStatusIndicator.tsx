'use client';

import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle, XCircle, AlertTriangle, ExternalLink, HelpCircle } from 'lucide-react';
import { llmService } from '@/services/llmService';
import LLMHelpModal from './LLMHelpModal';

interface LLMStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const LLMStatusIndicator: React.FC<LLMStatusIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [status, setStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const providersStatus = await llmService.getProvidersStatus();
      setStatus(providersStatus);
    } catch (error) {
      console.error('Erreur vérification statut LLM:', error);
      setStatus({});
    } finally {
      setLoading(false);
    }
  };

  const hasAvailableProvider = Object.values(status).some(Boolean);
  const ollamaAvailable = status.ollama;
  const openaiAvailable = status.openai;
  const huggingfaceAvailable = status.huggingface;

  const getStatusIcon = () => {
    if (loading) {
      return <Brain className="w-4 h-4 animate-pulse text-gray-400" />;
    }
    
    if (ollamaAvailable) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    if (openaiAvailable || huggingfaceAvailable) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
    
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (loading) return 'Vérification...';
    
    if (ollamaAvailable) {
      return 'IA locale active';
    }
    
    if (openaiAvailable) {
      return 'OpenAI configuré';
    }
    
    if (huggingfaceAvailable) {
      return 'Hugging Face configuré';
    }
    
    return 'Mode dégradé';
  };

  const getStatusColor = () => {
    if (loading) return 'text-gray-500';
    if (ollamaAvailable) return 'text-green-600';
    if (openaiAvailable || huggingfaceAvailable) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!showDetails) {
    return (
      <>
        <div 
          className={`relative inline-flex items-center space-x-2 ${className}`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          
          <button
            onClick={() => setShowHelpModal(true)}
            className="text-gray-400 hover:text-gray-600"
            title="En savoir plus sur l'IA"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          
          {showTooltip && (
            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
              <div className="space-y-2">
                <div className="font-medium">Statut des services IA :</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Ollama (local)</span>
                    {ollamaAvailable ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>OpenAI</span>
                    {openaiAvailable ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Hugging Face</span>
                    {huggingfaceAvailable ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                </div>
                {!hasAvailableProvider && (
                  <div className="text-yellow-300 text-xs mt-2">
                    Mode dégradé : templates prédéfinis utilisés
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <LLMHelpModal 
          isOpen={showHelpModal} 
          onClose={() => setShowHelpModal(false)} 
        />
      </>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Intelligence Artificielle</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={checkStatus}
              className="text-xs text-blue-600 hover:text-blue-800"
              disabled={loading}
            >
              {loading ? 'Vérification...' : 'Actualiser'}
            </button>
            <button
              onClick={() => setShowHelpModal(true)}
              className="text-gray-400 hover:text-gray-600"
              title="En savoir plus"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Ollama */}
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              {ollamaAvailable ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">Ollama</div>
                <div className="text-xs text-gray-500">IA locale gratuite</div>
              </div>
            </div>
            {!ollamaAvailable && (
              <a
                href="/OLLAMA_SETUP.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <span>Installer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* OpenAI */}
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              {openaiAvailable ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">OpenAI</div>
                <div className="text-xs text-gray-500">Service payant</div>
              </div>
            </div>
            {!openaiAvailable && (
              <div className="text-xs text-gray-500">OPENAI_API_KEY</div>
            )}
          </div>

          {/* Hugging Face */}
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              {huggingfaceAvailable ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">Hugging Face</div>
                <div className="text-xs text-gray-500">Service gratuit limité</div>
              </div>
            </div>
            {!huggingfaceAvailable && (
              <div className="text-xs text-gray-500">HUGGING_FACE_TOKEN</div>
            )}
          </div>
        </div>

        {/* Statut global */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <div>
              <div className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {hasAvailableProvider 
                  ? 'Les messages seront générés automatiquement avec une qualité optimale.'
                  : 'Les messages utilisent des templates prédéfinis. Installez Ollama pour améliorer la qualité.'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Recommandation */}
        {!ollamaAvailable && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Brain className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-green-800">
                  Recommandation
                </div>
                <div className="text-xs text-green-700 mt-1">
                  Installez Ollama pour bénéficier d'une IA locale gratuite et améliorer 
                  significativement la qualité des messages générés.
                </div>
                <div className="flex items-center space-x-3 mt-2">
                  <a
                    href="/OLLAMA_SETUP.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-green-600 hover:text-green-800"
                  >
                    <span>Guide d'installation</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => setShowHelpModal(true)}
                    className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>En savoir plus</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <LLMHelpModal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)} 
      />
    </>
  );
};

export default LLMStatusIndicator;