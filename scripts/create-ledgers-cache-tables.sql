-- Script SQL pour créer la persistance Supabase des grand livres fournisseurs et comptes divers

-- Table pour stocker les écritures fournisseurs par client (format JSON agrégé par client)
CREATE TABLE IF NOT EXISTS supplier_ledger_cache (
  id SERIAL PRIMARY KEY,
  client_id TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour stocker les écritures de comptes divers par client (format JSON agrégé par client)
CREATE TABLE IF NOT EXISTS misc_ledger_cache (
  id SERIAL PRIMARY KEY,
  client_id TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_supplier_ledger_client_id ON supplier_ledger_cache(client_id);
CREATE INDEX IF NOT EXISTS idx_misc_ledger_client_id ON misc_ledger_cache(client_id);

-- Fonction pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_supplier_ledger_updated_at ON supplier_ledger_cache;
CREATE TRIGGER update_supplier_ledger_updated_at
    BEFORE UPDATE ON supplier_ledger_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_misc_ledger_updated_at ON misc_ledger_cache;
CREATE TRIGGER update_misc_ledger_updated_at
    BEFORE UPDATE ON misc_ledger_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE supplier_ledger_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE misc_ledger_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on supplier_ledger_cache" ON supplier_ledger_cache;
CREATE POLICY "Allow all operations on supplier_ledger_cache" ON supplier_ledger_cache
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on misc_ledger_cache" ON misc_ledger_cache;
CREATE POLICY "Allow all operations on misc_ledger_cache" ON misc_ledger_cache
  FOR ALL USING (true);

COMMENT ON TABLE supplier_ledger_cache IS 'Écritures grand livre fournisseurs, agrégées par client (JSONB)';
COMMENT ON TABLE misc_ledger_cache IS 'Écritures grand livre comptes divers, agrégées par client (JSONB)';

-- =============================================================
-- RLS pour les tables normalisées (supplier_ledger, misc_ledger)
-- Activez et appliquez des politiques adaptées. Deux options:
--  - Option DEV (ouverte) : autorise tout pour anon/authenticated.
--  - Option SÉCURISÉE (recommandée) : isole par utilisateur si client_id = auth.uid().
-- =============================================================

-- Assurez-vous que ces tables existent déjà dans votre projet Supabase.
-- Si les noms diffèrent, adaptez-les ici.

-- Activer RLS
ALTER TABLE IF EXISTS supplier_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS misc_ledger ENABLE ROW LEVEL SECURITY;

-- Option DEV (ouverte) - à utiliser seulement en développement
DROP POLICY IF EXISTS "allow_all_supplier_ledger" ON supplier_ledger;
CREATE POLICY "allow_all_supplier_ledger" ON supplier_ledger
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_misc_ledger" ON misc_ledger;
CREATE POLICY "allow_all_misc_ledger" ON misc_ledger
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Option SÉCURISÉE (commentée) - décommentez si client_id = auth.uid()
-- DROP POLICY IF EXISTS "tenant_is_user_supplier_ledger" ON supplier_ledger;
-- CREATE POLICY "tenant_is_user_supplier_ledger" ON supplier_ledger
--   FOR ALL
--   TO authenticated
--   USING (client_id = auth.uid())
--   WITH CHECK (client_id = auth.uid());

-- DROP POLICY IF EXISTS "tenant_is_user_misc_ledger" ON misc_ledger;
-- CREATE POLICY "tenant_is_user_misc_ledger" ON misc_ledger
--   FOR ALL
--   TO authenticated
--   USING (client_id = auth.uid())
--   WITH CHECK (client_id = auth.uid());
