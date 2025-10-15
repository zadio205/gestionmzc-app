-- ==============================================================================
-- Script de création de la table profiles pour la gestion des rôles utilisateurs
-- ==============================================================================
-- Ce script crée la table profiles qui étend auth.users avec les rôles
-- et les relations hiérarchiques (super admin > admin > collaborateur/client)
--
-- À exécuter dans l'éditeur SQL de Supabase Dashboard
-- ==============================================================================

-- Suppression de la table existante si nécessaire (ATTENTION: perte de données!)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ==============================================================================
-- CRÉATION DE LA TABLE PROFILES
-- ==============================================================================

CREATE TABLE public.profiles (
  -- Identifiant unique du profil (correspond à l'UUID de auth.users)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rôle de l'utilisateur
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'collaborateur', 'client')),
  
  -- Référence vers l'admin parent (NULL pour superadmin et admin)
  admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Nom complet de l'utilisateur
  full_name TEXT,
  
  -- Référence optionnelle vers un client (pour les utilisateurs de type 'client')
  client_id TEXT,
  
  -- Avatar/photo de profil
  avatar_url TEXT,
  
  -- Métadonnées additionnelles (JSON flexible)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Horodatages
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEX POUR OPTIMISER LES REQUÊTES
-- ==============================================================================

-- Index sur le rôle pour filtrer rapidement par type d'utilisateur
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Index sur admin_id pour retrouver rapidement tous les utilisateurs d'un admin
CREATE INDEX idx_profiles_admin_id ON public.profiles(admin_id);

-- Index sur client_id pour les utilisateurs clients
CREATE INDEX idx_profiles_client_id ON public.profiles(client_id) WHERE client_id IS NOT NULL;

-- ==============================================================================
-- CONTRAINTES MÉTIER
-- ==============================================================================

-- Contrainte: un superadmin ou admin ne peut pas avoir d'admin_id
ALTER TABLE public.profiles
ADD CONSTRAINT chk_superadmin_admin_no_parent 
CHECK (
  (role IN ('superadmin', 'admin') AND admin_id IS NULL) OR 
  (role NOT IN ('superadmin', 'admin'))
);

-- Contrainte: un collaborateur ou client doit avoir un admin_id
ALTER TABLE public.profiles
ADD CONSTRAINT chk_collaborateur_client_has_parent 
CHECK (
  (role IN ('collaborateur', 'client') AND admin_id IS NOT NULL) OR 
  (role NOT IN ('collaborateur', 'client'))
);

-- ==============================================================================
-- FONCTION TRIGGER POUR METTRE À JOUR updated_at
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- FONCTION TRIGGER POUR CRÉER UN PROFIL LORS DE L'INSCRIPTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_role TEXT;
  raw_admin_id TEXT;
  resolved_role TEXT;
  resolved_admin UUID;
BEGIN
  raw_role := NULLIF(TRIM(BOTH ' ' FROM COALESCE(NEW.raw_user_meta_data->>'role', '')),'');
  raw_admin_id := NULLIF(TRIM(BOTH ' ' FROM COALESCE(NEW.raw_user_meta_data->>'admin_id', '')),'');

  IF raw_role IS NOT NULL THEN
    resolved_role := LOWER(raw_role);
  ELSE
    SELECT CASE
             WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'superadmin'
             ELSE 'client'
           END
      INTO resolved_role;
  END IF;

  IF resolved_role IN ('collaborateur', 'client') THEN
    IF raw_admin_id IS NULL THEN
      RAISE EXCEPTION USING MESSAGE = format('admin_id is required when creating a %s user', resolved_role);
    END IF;
    resolved_admin := raw_admin_id::uuid;
  ELSE
    resolved_admin := NULL;
  END IF;

  INSERT INTO public.profiles (id, role, admin_id, full_name, avatar_url, metadata)
  VALUES (
    NEW.id,
    resolved_role,
    resolved_admin,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.email),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- FONCTIONS UTILITAIRES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role(user_id) = required_role;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_admin_id(user_id UUID)
RETURNS UUID AS $$
  SELECT admin_id FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_admin_users(admin_user_id UUID)
RETURNS TABLE (
  id UUID,
  role TEXT,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.role,
    p.full_name,
    au.email,
    p.created_at
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.admin_id = admin_user_id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Activer RLS sur la table profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLICY 1: Les utilisateurs peuvent lire leur propre profil
-- ==============================================================================

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- ==============================================================================
-- POLICY 2: Les super admins peuvent tout voir
-- ==============================================================================

CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.get_user_role(auth.uid()) = 'superadmin');

-- ==============================================================================
-- POLICY 3: Les admins peuvent voir leurs collaborateurs et clients
-- ==============================================================================

CREATE POLICY "Admins can view their users"
ON public.profiles
FOR SELECT
USING (
  public.get_user_role(auth.uid()) = 'admin'
  AND (
    auth.uid() = profiles.id OR
    auth.uid() = profiles.admin_id
  )
);

-- ==============================================================================
-- POLICY 4: Les collaborateurs peuvent voir les clients de leur admin
-- ==============================================================================

CREATE POLICY "Collaborateurs can view admin's clients"
ON public.profiles
FOR SELECT
USING (
  public.get_user_role(auth.uid()) = 'collaborateur'
  AND (
    auth.uid() = profiles.id OR
    profiles.id = public.get_admin_id(auth.uid()) OR
    (
      profiles.role = 'client'
      AND profiles.admin_id = public.get_admin_id(auth.uid())
    )
  )
);

-- ==============================================================================
-- POLICY 5: Les super admins peuvent tout modifier
-- ==============================================================================

CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.get_user_role(auth.uid()) = 'superadmin');

-- ==============================================================================
-- POLICY 6: Les admins peuvent modifier leurs utilisateurs
-- ==============================================================================

CREATE POLICY "Admins can update their users"
ON public.profiles
FOR UPDATE
USING (
  public.get_user_role(auth.uid()) = 'admin'
  AND (
    auth.uid() = profiles.id OR
    auth.uid() = profiles.admin_id
  )
)
WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin'
  AND (
    auth.uid() = profiles.id OR
    auth.uid() = profiles.admin_id
  )
);

-- ==============================================================================
-- POLICY 7: Les utilisateurs peuvent modifier leur propre profil (limité)
-- ==============================================================================

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  role = public.get_user_role(auth.uid()) AND
  COALESCE(admin_id::text, '') = COALESCE(public.get_admin_id(auth.uid())::text, '')
);

-- ==============================================================================
-- POLICY 8: Les super admins peuvent créer tout type d'utilisateur
-- ==============================================================================

CREATE POLICY "Super admins can insert any profile"
ON public.profiles
FOR INSERT
WITH CHECK (public.get_user_role(auth.uid()) = 'superadmin');

-- ==============================================================================
-- POLICY 9: Les admins peuvent créer collaborateurs et clients
-- ==============================================================================

CREATE POLICY "Admins can insert collaborateurs and clients"
ON public.profiles
FOR INSERT
WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin'
  AND role IN ('collaborateur', 'client')
  AND admin_id = auth.uid()
);

-- ==============================================================================
-- POLICY 10: Les super admins peuvent supprimer n'importe quel profil
-- ==============================================================================

CREATE POLICY "Super admins can delete any profile"
ON public.profiles
FOR DELETE
USING (public.get_user_role(auth.uid()) = 'superadmin');

-- ==============================================================================
-- POLICY 11: Les admins peuvent supprimer leurs utilisateurs
-- ==============================================================================

CREATE POLICY "Admins can delete their users"
ON public.profiles
FOR DELETE
USING (
  public.get_user_role(auth.uid()) = 'admin'
  AND profiles.admin_id = auth.uid()
);

-- ==============================================================================
-- INSERTION DU PREMIER SUPER ADMIN (À PERSONNALISER)
-- ==============================================================================

-- IMPORTANT: Remplacer 'your-email@example.com' par votre email réel
-- Décommenter et exécuter après avoir créé votre compte utilisateur

/*
UPDATE public.profiles
SET role = 'superadmin', admin_id = NULL
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
*/

-- ==============================================================================
-- VÉRIFICATION
-- ==============================================================================

-- Afficher tous les profils
-- SELECT p.*, au.email FROM public.profiles p JOIN auth.users au ON au.id = p.id;

-- ==============================================================================
-- FIN DU SCRIPT
-- ==============================================================================
