-- ========================================
-- POLITIQUES SUPABASE STORAGE
-- ========================================
-- Ces politiques permettent de gérer l'accès aux fichiers dans le bucket 'uploads'
-- À créer via l'interface Supabase Dashboard → Storage → Policies

-- ========================================
-- MÉTHODE 1: Via l'interface Supabase
-- ========================================

/*
1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Storage → Buckets → uploads → Policies
4. Créez les 3 politiques suivantes:

POLITIQUE 1: Lecture publique
────────────────────────────
Name: Public read access for uploads
Allowed operation: SELECT
Policy definition: bucket_id = 'uploads'
Target roles: public

POLITIQUE 2: Upload authentifié
────────────────────────────
Name: Authenticated upload
Allowed operation: INSERT  
Policy definition: bucket_id = 'uploads' AND auth.role() = 'authenticated'
Target roles: authenticated

POLITIQUE 3: Suppression authentifiée
────────────────────────────
Name: Authenticated delete
Allowed operation: DELETE
Policy definition: bucket_id = 'uploads' AND auth.role() = 'authenticated'
Target roles: authenticated
*/

-- ========================================
-- MÉTHODE 2: Via SQL (Alternative)
-- ========================================
-- Si vous préférez utiliser SQL, voici les commandes

-- Politique 1: Lecture publique
CREATE POLICY "Public read access for uploads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- Politique 2: Upload pour utilisateurs authentifiés
CREATE POLICY "Authenticated upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Politique 3: Suppression pour utilisateurs authentifiés
CREATE POLICY "Authenticated delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');

-- ========================================
-- VÉRIFICATION
-- ========================================

-- Vérifier les politiques Storage
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- ========================================
-- POLITIQUES AVANCÉES (Optionnelles)
-- ========================================

/*
Si vous voulez des restrictions plus fines:

POLITIQUE: Seuls les admins peuvent supprimer
────────────────────────────
Name: Admin only delete
Allowed operation: DELETE
Policy definition: 
  bucket_id = 'uploads' 
  AND (
    SELECT raw_user_meta_data->>'role' 
    FROM auth.users 
    WHERE id = auth.uid()
  ) = 'admin'
Target roles: authenticated

POLITIQUE: Upload limité par client
────────────────────────────
Name: Client scoped upload
Allowed operation: INSERT
Policy definition:
  bucket_id = 'uploads'
  AND name LIKE (
    SELECT 'justificatifs/clients/' || raw_user_meta_data->>'client_id' || '/%'
    FROM auth.users
    WHERE id = auth.uid()
  )
Target roles: authenticated
*/

-- ========================================
-- NOTES IMPORTANTES
-- ========================================

/*
1. BUCKET REQUIS
   ✅ Créez d'abord le bucket 'uploads' dans Storage
   ✅ Cochez "Public bucket" pour permettre les URLs publiques

2. ORDRE DES OPÉRATIONS
   1. Créer le bucket
   2. Appliquer ces politiques
   3. Tester l'upload

3. SÉCURITÉ
   ✅ Les utilisateurs non authentifiés peuvent LIRE (URLs publiques)
   ✅ Les utilisateurs authentifiés peuvent UPLOADER
   ✅ Les utilisateurs authentifiés peuvent SUPPRIMER
   ⚠️  Adaptez selon vos besoins de sécurité

4. TEST RAPIDE
   -- Tester l'upload via l'API
   POST /api/upload
   Body: FormData avec file
   Headers: x-user-id: votre_user_id
   
   -- Vérifier le fichier dans Storage
   Dashboard → Storage → uploads → justificatifs/...

5. DÉPANNAGE
   Erreur "Permission denied" ?
   → Vérifiez que les politiques sont bien créées
   → Vérifiez que l'utilisateur est authentifié
   → Vérifiez les logs: Dashboard → Logs → Storage
   
   Fichier non visible ?
   → Vérifiez la politique SELECT (lecture publique)
   → Vérifiez que le bucket est bien 'public'
   → Testez l'URL publique directement

6. CONFIGURATION RECOMMANDÉE
   Pour un système de justificatifs:
   ✅ Lecture publique (URLs partageables)
   ✅ Upload authentifié (sécurité)
   ✅ Suppression authentifiée ou admin uniquement
*/
