// Guard contre les erreurs d'extension de navigateur
(function() {
  'use strict';
  
  // Intercepter les erreurs d'extension
  window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('Extension context invalidated')) {
      console.warn('🔧 Extension de navigateur invalidée détectée - rechargement de la page recommandé');
      // Optionnel : recharger automatiquement la page
      // window.location.reload();
      return true; // Empêche la propagation de l'erreur
    }
  });
  
  // Vérifier si le contexte d'extension est valide
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    try {
      chrome.runtime.connect();
    } catch (e) {
      console.warn('🔧 Contexte d\'extension Chrome invalide détecté');
    }
  }
})();
