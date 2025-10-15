import { createClient } from '@supabase/supabase-js';

// Lecture et validation des variables d'environnement publiques (exposées au client)
const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!PUBLIC_URL || !PUBLIC_ANON_KEY) {
  // Aide au diagnostique côté client pendant le dev
  if (typeof window !== 'undefined') {
    // Log clair en dev; ne pas inclure de secrets
     
    console.error(
      '[Config] Variables manquantes: NEXT_PUBLIC_SUPABASE_URL et/ou NEXT_PUBLIC_SUPABASE_ANON_KEY.\n' +
      'Créez .env.local à la racine et redémarrez le serveur de dev.'
    );
  }
  throw new Error('Configuration Supabase manquante (client): NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabaseBrowser = createClient(PUBLIC_URL, PUBLIC_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
  },
});
