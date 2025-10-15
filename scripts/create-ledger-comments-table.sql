-- Table des commentaires liés aux écritures des grands livres
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.ledger_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  entry_id text NOT NULL,
  ledger_type text NOT NULL CHECK (ledger_type IN ('client','supplier','misc')),
  author text,
  author_type text CHECK (author_type IN ('client','collaborateur','admin')),
  content text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  is_internal boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ledger_comments_client_entry_idx
  ON public.ledger_comments (client_id, entry_id, ledger_type, created_at);

ALTER TABLE IF EXISTS public.ledger_comments ENABLE ROW LEVEL SECURITY;

-- Politique DEV ouverte (à restreindre en prod)
DROP POLICY IF EXISTS "allow_all_ledger_comments" ON public.ledger_comments;
CREATE POLICY "allow_all_ledger_comments" ON public.ledger_comments
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
