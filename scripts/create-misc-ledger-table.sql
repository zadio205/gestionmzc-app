-- Création de la table normalisée misc_ledger alignée avec le mapping de l'application
-- Exécutez ce script dans l'éditeur SQL de Supabase.

-- IMPORTANT: Supprimer la table existante si elle a de mauvaises contraintes
DROP TABLE IF EXISTS public.misc_ledger CASCADE;

-- Table normalisée (une ligne par écriture)
CREATE TABLE public.misc_ledger (
  id uuid PRIMARY KEY,
  client_id text NOT NULL,
  date date,
  account_number text,
  account_name text,
  description text,
  debit numeric(18,2) DEFAULT 0,
  credit numeric(18,2) DEFAULT 0,
  balance numeric(18,2) DEFAULT 0,
  reference text,
  category text,
  import_index integer,
  ai_meta jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index utile pour les requêtes .eq('client_id').order('date')
CREATE INDEX IF NOT EXISTS misc_ledger_client_date_idx
  ON public.misc_ledger (client_id, date);

-- Activer RLS (Row Level Security)
ALTER TABLE IF EXISTS public.misc_ledger ENABLE ROW LEVEL SECURITY;

-- Politique DEV (ouverte) - à utiliser seulement en développement
DROP POLICY IF EXISTS "allow_all_misc_ledger" ON public.misc_ledger;
CREATE POLICY "allow_all_misc_ledger" ON public.misc_ledger
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Remarques:
-- 1) L'application envoie la colonne id (UUID) elle-même; aucun DEFAULT n'est requis ici.
-- 2) Les montants sont en numeric(18,2) pour éviter les erreurs d'arrondi.
-- 3) Si vous souhaitez une politique plus stricte, remplacez la politique DEV par une version tenant-aware:
--    USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid())
