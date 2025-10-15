import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

// Fonction pour obtenir les variables d'environnement de manière fiable
const getEnvVars = () => {
  // En production et sur le serveur, utiliser process.env directement
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  return {
    url: SUPABASE_URL,
    key: SUPABASE_SERVICE_ROLE_KEY
  };
};

export const supabaseServer = () => {
  const { url, key } = getEnvVars();

  if (!url || !key) {
    const errorMessage = `Supabase configuration manquante: URL=${!!url}, KEY=${!!key}`;
    logger.error(errorMessage, {
      hasUrl: !!url,
      hasKey: !!key,
      nodeEnv: process.env.NODE_ENV,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
    });
    throw new Error(errorMessage);
  }

  try {
    const client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: { 'x-client-info': 'gestionmzc-api' }
      },
    });

    return client;
  } catch (error) {
    logger.error('Failed to create Supabase client', { error });
    throw error;
  }
};
