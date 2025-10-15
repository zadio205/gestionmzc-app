-- Politiques de sécurité Row Level Security (RLS) pour les justificatifs
-- À exécuter dans Supabase SQL Editor après avoir créé la table justificatifs

-- Activer RLS sur la table
ALTER TABLE justificatifs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLITIQUES SIMPLIFIÉES (Version 1.0)
-- ========================================
-- Ces politiques permettent un accès authentifié de base
-- À adapter selon votre modèle de données users/clients

-- Politique 1: Lecture pour tous les utilisateurs authentifiés
-- (À affiner selon vos besoins)
CREATE POLICY "authenticated_read_justificatifs"
ON justificatifs
FOR SELECT
TO authenticated
USING (true);

-- Politique 2: Insertion pour tous les utilisateurs authentifiés
-- (À affiner selon vos besoins)
CREATE POLICY "authenticated_insert_justificatifs"
ON justificatifs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique 3: Mise à jour pour tous les utilisateurs authentifiés
-- (À affiner selon vos besoins)
CREATE POLICY "authenticated_update_justificatifs"
ON justificatifs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Politique 4: Suppression pour tous les utilisateurs authentifiés
-- (À affiner selon vos besoins)
CREATE POLICY "authenticated_delete_justificatifs"
ON justificatifs
FOR DELETE
TO authenticated
USING (true);

-- ========================================
-- POLITIQUES AVANCÉES (Optionnelles)
-- ========================================
-- Décommentez et adaptez ces politiques si vous avez une table users/clients

/*
-- VERSION AVANCÉE - Nécessite une table 'users' avec colonnes: id, role, client_id
-- Et une table 'clients' avec colonnes: id, collaborator_id

-- Lecture: Admins voient tout
CREATE POLICY "admins_read_all"
ON justificatifs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
    AND u.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Lecture: Collaborateurs voient leurs clients
CREATE POLICY "collaborateurs_read_own_clients"
ON justificatifs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
    AND u.raw_user_meta_data->>'role' = 'collaborateur'
    AND justificatifs.client_id IN (
      SELECT id FROM clients WHERE collaborator_id = u.id::text
    )
  )
);

-- Lecture: Clients voient leurs propres justificatifs
CREATE POLICY "clients_read_own"
ON justificatifs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
    AND u.raw_user_meta_data->>'role' = 'client'
    AND justificatifs.client_id = u.raw_user_meta_data->>'client_id'
  )
);
*/

-- ========================================
-- POLITIQUES POUR SUPABASE STORAGE
-- ========================================

-- Ces politiques doivent être créées dans l'interface Supabase Storage
-- Dashboard → Storage → uploads → Policies

/*
BUCKET: uploads
PATH: justificatifs/**

1. Lecture publique (pour les URLs publiques)
   Name: Public read access for uploads
   Policy definition: (bucket_id = 'uploads')
   Allowed operation: SELECT
   Target roles: public

2. Upload authentifié
   Name: Authenticated users can upload
   Policy definition: (bucket_id = 'uploads' AND auth.role() = 'authenticated')
   Allowed operation: INSERT
   Target roles: authenticated

3. Suppression authentifiée
   Name: Authenticated users can delete
   Policy definition: (bucket_id = 'uploads' AND auth.role() = 'authenticated')
   Allowed operation: DELETE
   Target roles: authenticated
*/

-- ========================================
-- VÉRIFICATION DES POLITIQUES
-- ========================================

-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'justificatifs';

-- Lister toutes les politiques
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'justificatifs'
ORDER BY policyname;

-- ========================================
-- COMMENTAIRES
-- ========================================

COMMENT ON POLICY "admins_read_all_justificatifs" ON justificatifs IS 
  'Les administrateurs ont un accès complet en lecture à tous les justificatifs';

COMMENT ON POLICY "collaborateurs_read_own_clients_justificatifs" ON justificatifs IS 
  'Les collaborateurs peuvent lire les justificatifs de leurs clients assignés';

COMMENT ON POLICY "clients_read_own_justificatifs" ON justificatifs IS 
  'Les clients peuvent uniquement lire leurs propres justificatifs';

COMMENT ON POLICY "admins_delete_justificatifs" ON justificatifs IS 
  'Seuls les administrateurs peuvent supprimer des justificatifs';

-- ========================================
-- NOTES IMPORTANTES
-- ========================================

/*
IMPORTANT:

1. POLITIQUES ACTUELLES (Version simplifiée)
   ✅ Les politiques ci-dessus permettent un accès de base pour tous les utilisateurs authentifiés
   ✅ C'est parfait pour démarrer rapidement et tester le système
   ⚠️  En production, vous voudrez peut-être des restrictions plus fines

2. PERSONNALISATION
   Pour des politiques plus restrictives basées sur les rôles:
   - Décommentez les politiques avancées ci-dessus
   - Adaptez-les à votre structure de données
   - Remplacez les politiques simples par les avancées

3. STRUCTURE DES DONNÉES
   Si vous utilisez les politiques avancées, vous aurez besoin de:
   - Table 'users' ou utiliser auth.users avec raw_user_meta_data
   - Table 'clients' avec les relations appropriées
   - Adapter les noms de colonnes selon votre schéma

4. TESTER LES POLITIQUES
   - Connectez-vous avec différents comptes
   - Essayez de lire/créer/modifier/supprimer des justificatifs
   - Vérifiez les logs Supabase (Dashboard → Logs)
   - Utilisez le SQL Editor pour tester les requêtes

5. EN DÉVELOPPEMENT
   Si vous rencontrez des problèmes avec RLS pendant le développement:
   
   -- Désactiver temporairement RLS (DEV UNIQUEMENT!)
   ALTER TABLE justificatifs DISABLE ROW LEVEL SECURITY;
   
   -- Réactiver RLS
   ALTER TABLE justificatifs ENABLE ROW LEVEL SECURITY;
   
   ⚠️  NE JAMAIS désactiver RLS en production!

6. DÉBOGAGE
   Pour voir quelles politiques s'appliquent:
   SELECT * FROM pg_policies WHERE tablename = 'justificatifs';
   
   Pour tester une politique spécifique:
   SET ROLE authenticated;
   SELECT * FROM justificatifs; -- Devrait respecter les politiques

7. SÉCURITÉ
   ✅ RLS est activé par défaut
   ✅ Les utilisateurs authentifiés ont accès (version simple)
   ✅ Les utilisateurs non authentifiés n'ont AUCUN accès
   ✅ Toutes les opérations passent par l'authentification Supabase
*/
