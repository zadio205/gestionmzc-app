-- Script SQL pour créer les tables nécessaires au cache de balance dans Supabase

-- Table pour stocker les caches de balance
CREATE TABLE IF NOT EXISTS balance_cache (
    id SERIAL PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    client_id TEXT NOT NULL,
    period TEXT,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_balance_cache_cache_key ON balance_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_balance_cache_client_id ON balance_cache(client_id);
CREATE INDEX IF NOT EXISTS idx_balance_cache_period ON balance_cache(period);

-- Table pour stocker les dernières périodes utilisées par client
CREATE TABLE IF NOT EXISTS balance_last_period (
    id SERIAL PRIMARY KEY,
    client_id TEXT UNIQUE NOT NULL,
    period TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_balance_last_period_client_id ON balance_last_period(client_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_balance_cache_updated_at ON balance_cache;
CREATE TRIGGER update_balance_cache_updated_at
    BEFORE UPDATE ON balance_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_balance_last_period_updated_at ON balance_last_period;
CREATE TRIGGER update_balance_last_period_updated_at
    BEFORE UPDATE ON balance_last_period
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Politiques de sécurité RLS (Row Level Security) - à ajuster selon vos besoins
ALTER TABLE balance_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_last_period ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations pour l'instant (à affiner selon vos besoins d'authentification)
DROP POLICY IF EXISTS "Allow all operations on balance_cache" ON balance_cache;
CREATE POLICY "Allow all operations on balance_cache" ON balance_cache
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on balance_last_period" ON balance_last_period;
CREATE POLICY "Allow all operations on balance_last_period" ON balance_last_period
    FOR ALL USING (true);

-- Commentaires pour documenter les tables
COMMENT ON TABLE balance_cache IS 'Stockage des caches de balance par client et période';
COMMENT ON COLUMN balance_cache.cache_key IS 'Clé unique du cache au format clientId::period';
COMMENT ON COLUMN balance_cache.client_id IS 'Identifiant du client';
COMMENT ON COLUMN balance_cache.period IS 'Période de la balance (peut être null)';
COMMENT ON COLUMN balance_cache.data IS 'Données de balance au format JSON';

COMMENT ON TABLE balance_last_period IS 'Stockage de la dernière période utilisée par client';
COMMENT ON COLUMN balance_last_period.client_id IS 'Identifiant du client';
COMMENT ON COLUMN balance_last_period.period IS 'Dernière période utilisée par ce client';
