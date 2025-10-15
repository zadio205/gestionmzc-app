/**
 * Script pour nettoyer automatiquement les sessions invalides
 * Peut être inclus dans layout.tsx pour s'exécuter au chargement de l'app
 */
(function() {
  'use strict';

  // Vérifier si nous sommes dans un navigateur
  if (typeof window === 'undefined') return;

  // Écouter les erreurs Supabase
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Détecter les erreurs de refresh token invalide
    const errorString = args.join(' ');
    if (
      errorString.includes('Invalid Refresh Token') ||
      errorString.includes('Refresh Token Not Found') ||
      errorString.includes('AuthApiError')
    ) {
      console.warn('[Auth] Token invalide détecté, nettoyage de la session...');
      
      // Nettoyer le localStorage et sessionStorage
      try {
        // Nettoyer uniquement les clés Supabase
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
        
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            sessionStorage.removeItem(key);
          }
        });
        
        console.info('[Auth] Session nettoyée, redirection vers la page de connexion...');
        
        // Rediriger vers la page de connexion après un court délai
        setTimeout(() => {
          window.location.href = '/auth/signin';
        }, 1000);
      } catch (cleanupError) {
        console.error('[Auth] Erreur lors du nettoyage:', cleanupError);
      }
    }
    
    // Appeler la fonction console.error originale
    originalConsoleError.apply(console, args);
  };

  console.info('[Auth] Script de nettoyage de session chargé');
})();
