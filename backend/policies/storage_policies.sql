-- ==============================================================================
-- storage_policies.sql
-- Bucket `signalements-photos` + politiques d'accès
-- ==============================================================================
-- À appliquer APRÈS les migrations, les fonctions et le RLS (Section 0 de
-- rls_policies.sql révoque les droits par défaut, il faut donc les rendre ici).
--
-- Choix : bucket PUBLIC. Les photos "avant"/"après" doivent être affichées sur
-- la carte et dans le fil sans authentification, sinon il faudrait signer
-- chaque URL côté client (impossible avec la clé anon).

-- 1. Création du bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'signalements-photos',
    'signalements-photos',
    true,
    1048576,                                        -- 1 Mo (le client compresse à 0.35 Mo)
    ARRAY['image/jpeg', 'image/png', 'image/webp']  -- pas d'exécutable, pas d'HTML
)
ON CONFLICT (id) DO UPDATE
    SET public             = EXCLUDED.public,
        file_size_limit    = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Lecture publique des photos
DROP POLICY IF EXISTS "Lecture publique des photos" ON storage.objects;
CREATE POLICY "Lecture publique des photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'signalements-photos');

-- 3. Upload réservé aux utilisateurs authentifiés
DROP POLICY IF EXISTS "Upload de photos par les authentifies" ON storage.objects;
CREATE POLICY "Upload de photos par les authentifies"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'signalements-photos');

-- 4. Mise a jour / suppression reservees au proprietaire du fichier
-- ATTENTION : la colonne de propriete est `owner` (UUID). Il existe aussi
-- `owner_id`, mais elle est de type TEXT : l'utiliser provoque
-- "operator does not exist: text = uuid".
DROP POLICY IF EXISTS "Modification de sa propre photo" ON storage.objects;
CREATE POLICY "Modification de sa propre photo"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'signalements-photos' AND (SELECT owner) = (SELECT auth.uid()))
    WITH CHECK (bucket_id = 'signalements-photos' AND (SELECT owner) = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Suppression de sa propre photo" ON storage.objects;
CREATE POLICY "Suppression de sa propre photo"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'signalements-photos' AND (SELECT owner) = (SELECT auth.uid()));
