-- Table pour stocker les métadonnées des justificatifs dans la GED
-- Structure compatible avec l'interface Justificatif de TypeScript

CREATE TABLE IF NOT EXISTS justificatifs (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations de fichier
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  path TEXT NOT NULL,
  url TEXT,
  
  -- Classement et organisation
  client_id TEXT NOT NULL,
  client_name TEXT,
  entry_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('achats', 'ventes')),
  
  -- Métadonnées comptables
  montant DECIMAL(10, 2),
  reference TEXT,
  description TEXT,
  date_ecriture TIMESTAMP,
  
  -- Informations de stockage
  provider TEXT DEFAULT 'supabase',
  bucket TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  
  -- Gestion
  uploaded_by TEXT NOT NULL,
  uploaded_by_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  mime_type TEXT NOT NULL,
  tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_justificatifs_client_id ON justificatifs(client_id);
CREATE INDEX IF NOT EXISTS idx_justificatifs_entry_id ON justificatifs(entry_id);
CREATE INDEX IF NOT EXISTS idx_justificatifs_category ON justificatifs(category);
CREATE INDEX IF NOT EXISTS idx_justificatifs_status ON justificatifs(status);
CREATE INDEX IF NOT EXISTS idx_justificatifs_created_at ON justificatifs(created_at DESC);

-- Index pour les recherches combinées fréquentes
CREATE INDEX IF NOT EXISTS idx_justificatifs_client_category ON justificatifs(client_id, category);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_justificatifs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_justificatifs_updated_at
  BEFORE UPDATE ON justificatifs
  FOR EACH ROW
  EXECUTE FUNCTION update_justificatifs_updated_at();

-- Commentaires sur la table
COMMENT ON TABLE justificatifs IS 'Métadonnées des justificatifs comptables stockés dans Supabase Storage';
COMMENT ON COLUMN justificatifs.category IS 'Classement automatique: achats (débit) ou ventes (crédit)';
COMMENT ON COLUMN justificatifs.status IS 'Statut de validation du justificatif';
COMMENT ON COLUMN justificatifs.path IS 'Chemin complet dans le bucket Supabase Storage';
