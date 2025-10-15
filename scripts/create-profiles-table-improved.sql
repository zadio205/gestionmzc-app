-- ==============================================================================
-- Script de création AMÉLIORÉ de la table profiles
-- Version: 2.0 - Avec corrections recommandées
-- ==============================================================================
-- Ce script crée la table profiles avec les améliorations suivantes:
-- - Gestion automatique de admin_id dans le trigger
-- - Validation renforcée
-- - Meilleure gestion des erreurs
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
  
  -- Référence optionnelle vers un client (TEXT pour flexibilité, peut être converti en UUID si table clients existe)
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

-- Index composite pour requêtes fréquentes
CREATE INDEX idx_profiles_role_admin_id ON public.profiles(role, admin_id);

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
-- FONCTION TRIGGER AMÉLIORÉE POUR CRÉER UN PROFIL LORS DE L'INSCRIPTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_admin_id UUID;
  v_client_id TEXT;
BEGIN
  -- Extraire le rôle des metadata (défaut: 'superadmin' pour simplifier la création initiale)
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'superadmin');
  
  -- Extraire admin_id si présent
  BEGIN
    v_admin_id := (NEW.raw_user_meta_data->>'admin_id')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      v_admin_id := NULL;
  END;
  
  -- Extraire client_id si présent
  v_client_id := NEW.raw_user_meta_data->>'client_id';
  
  -- Vérifier la cohérence: superadmin/admin ne doivent PAS avoir d'admin_id
  IF v_role IN ('superadmin', 'admin') THEN
    v_admin_id := NULL;
  END IF;
  
  -- Vérifier la cohérence: collaborateur/client doivent avoir un admin_id
  -- Si manquant, logger un warning mais créer quand même le profil
  IF v_role IN ('collaborateur', 'client') AND v_admin_id IS NULL THEN
    RAISE WARNING 'Utilisateur % créé avec rôle % sans admin_id', NEW.email, v_role;
  END IF;
  
  -- Créer le profil
  INSERT INTO public.profiles (
    id, 
    role, 
    admin_id, 
    full_name, 
    client_id, 
    avatar_url, 
    metadata
  )
  VALUES (
    NEW.id,
    v_role,
    v_admin_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    v_client_id,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas bloquer la création de l'utilisateur
    RAISE WARNING 'Erreur lors de la création du profil pour %: %', NEW.email, SQLERRM;
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

-- Nouvelle fonction: compter les utilisateurs par rôle
CREATE OR REPLACE FUNCTION public.count_users_by_role()
RETURNS TABLE (
  role TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.role,
    COUNT(*) as count
  FROM public.profiles p
  GROUP BY p.role
  ORDER BY p.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nouvelle fonction: valider la hiérarchie des rôles
CREATE OR REPLACE FUNCTION public.validate_role_hierarchy()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  issue TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Collaborateurs/clients sans admin_id
  SELECT 
    p.id,
    au.email,
    p.role,
    'Missing admin_id for ' || p.role as issue
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.role IN ('collaborateur', 'client') AND p.admin_id IS NULL
  
  UNION ALL
  
  -- Superadmin/admin avec admin_id
  SELECT 
    p.id,
    au.email,
    p.role,
    'Should not have admin_id for ' || p.role as issue
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.role IN ('superadmin', 'admin') AND p.admin_id IS NOT NULL;
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
-- INSERTION DU PREMIER SUPER ADMIN
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
-- SCRIPTS DE VÉRIFICATION
-- ==============================================================================

-- Vérifier la structure
-- \d public.profiles

-- Vérifier les contraintes
-- SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'profiles';

-- Vérifier les policies
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Compter les utilisateurs par rôle
-- SELECT * FROM public.count_users_by_role();

-- Valider la hiérarchie
-- SELECT * FROM public.validate_role_hierarchy();

-- Afficher tous les profils avec leur email
-- SELECT p.id, p.role, p.full_name, au.email, p.admin_id, p.created_at 
-- FROM public.profiles p 
-- JOIN auth.users au ON au.id = p.id 
-- ORDER BY p.created_at DESC;

-- ==============================================================================
-- FIN DU SCRIPT
-- ==============================================================================
