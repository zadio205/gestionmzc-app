'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Barre de progression pour les transitions de navigation
 * Style YouTube/GitHub pour masquer la latence
 */
export default function NavigationProgress() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;

    const startLoading = () => {
      setLoading(true);
      setProgress(0);

      // Animation progressive de la barre
      let currentProgress = 0;
      progressTimer = setInterval(() => {
        currentProgress += Math.random() * 10;
        if (currentProgress > 90) {
          clearInterval(progressTimer);
          setProgress(90);
        } else {
          setProgress(currentProgress);
        }
      }, 100);

      // Timeout de sécurité
      timer = setTimeout(() => {
        setLoading(false);
        setProgress(100);
        clearInterval(progressTimer);
      }, 3000);
    };

    const completeLoading = () => {
      clearInterval(progressTimer);
      clearTimeout(timer);
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    };

    // Écouter les événements de navigation
    const handleStart = () => startLoading();
    const handleComplete = () => completeLoading();

    // Créer des événements personnalisés pour la navigation
    window.addEventListener('navigationStart', handleStart);
    window.addEventListener('navigationComplete', handleComplete);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
      window.removeEventListener('navigationStart', handleStart);
      window.removeEventListener('navigationComplete', handleComplete);
    };
  }, []);

  // Compléter la barre quand le pathname change
  useEffect(() => {
    if (loading) {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gray-100/80 backdrop-blur-sm border-b border-gray-200/50"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-label="Chargement de la page"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 transition-all duration-300 ease-out relative"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 12px rgba(59, 130, 246, 0.6), 0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Animated shimmer effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"
          style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
          }}
        />
      </div>
      
      {/* Add shimmer keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
