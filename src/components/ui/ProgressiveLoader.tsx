'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  duration?: number;
}

interface ProgressiveLoaderProps {
  steps: LoadingStep[];
  onComplete?: () => void;
  onError?: (error: any) => void;
  showSteps?: boolean;
  title?: string;
  subtitle?: string;
  autoProgress?: boolean;
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  steps: initialSteps,
  onComplete,
  onError,
  showSteps = true,
  title = "Chargement en cours...",
  subtitle,
  autoProgress = true
}) => {
  const [steps, setSteps] = useState<LoadingStep[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Fonction pour mettre à jour le statut d'une étape
  const updateStepStatus = useCallback((stepId: string, status: LoadingStep['status']) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  }, []);

  // Progression automatique si activée
  useEffect(() => {
    if (!autoProgress) return;

    let timeoutId: NodeJS.Timeout;
    const currentStep = steps[currentStepIndex];

    if (currentStep && currentStep.status === 'pending') {
      // Marquer l'étape comme en cours
      updateStepStatus(currentStep.id, 'loading');

      // Simuler le temps de chargement
      const duration = currentStep.duration || 800;
      timeoutId = setTimeout(() => {
        updateStepStatus(currentStep.id, 'completed');
        
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          setIsCompleted(true);
          onComplete?.();
        }
      }, duration);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentStepIndex, steps, updateStepStatus, onComplete, autoProgress]);

  // Calcul du progrès
  useEffect(() => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const newProgress = (completedSteps / steps.length) * 100;
    setProgress(newProgress);
  }, [steps]);

  const getStepIcon = (step: LoadingStep) => {
    switch (step.status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepTextColor = (step: LoadingStep) => {
    switch (step.status) {
      case 'loading':
        return 'text-blue-600 font-medium';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* En-tête */}
        <div className="text-center mb-8">
          {!isCompleted ? (
            <div className="relative mb-6">
              <div className="w-16 h-16 mx-auto bg-blue-600 rounded-xl shadow-lg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
          ) : (
            <div className="relative mb-6">
              <div className="w-16 h-16 mx-auto bg-green-600 rounded-xl shadow-lg flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
            </div>
          )}

          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {isCompleted ? "Chargement terminé !" : title}
          </h2>
          
          {subtitle && (
            <p className="text-gray-600 text-sm">
              {subtitle}
            </p>
          )}
        </div>

        {/* Barre de progression */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progression</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Étapes détaillées */}
        {showSteps && (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                  step.status === 'loading' ? 'bg-blue-50' :
                  step.status === 'completed' ? 'bg-green-50' :
                  step.status === 'error' ? 'bg-red-50' :
                  'bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0">
                  {getStepIcon(step)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${getStepTextColor(step)} truncate`}>
                    {step.label}
                  </p>
                </div>
                {step.status === 'loading' && (
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message de fin */}
        {isCompleted && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 text-center">
              Redirection en cours...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressiveLoader;