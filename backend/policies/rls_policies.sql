-- ==============================================================================
-- rls_policies.sql
-- Politiques Row Level Security (RLS) pour sécuriser l'accès aux données
-- ==============================================================================

-- 1. Table profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique des profils" ON public.profiles;
CREATE POLICY "Lecture publique des profils"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Modification de son propre profil" ON public.profiles;
CREATE POLICY "Modification de son propre profil"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. Table categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique des categories" ON public.categories;
CREATE POLICY "Lecture publique des categories"
    ON public.categories FOR SELECT
    USING (true);

-- 3. Table signalements
ALTER TABLE public.signalements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique de tous les signalements" ON public.signalements;
CREATE POLICY "Lecture publique de tous les signalements"
    ON public.signalements FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Creation de signalement par utilisateur authentifie" ON public.signalements;
CREATE POLICY "Creation de signalement par utilisateur authentifie"
    ON public.signalements FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Modification par le declarant ou mise a jour nettoyage" ON public.signalements;
CREATE POLICY "Modification par le declarant ou mise a jour nettoyage"
    ON public.signalements FOR UPDATE
    TO authenticated
    USING (
        -- Le déclarant peut modifier sa description ou ses infos
        auth.uid() = user_id
        OR
        -- Tout utilisateur authentifié peut intervenir pour nettoyer si non encore nettoyé
        (statut IN ('en_attente', 'vu'))
    )
    WITH CHECK (
        auth.uid() = user_id
        OR
        (nettoye_par_user_id = auth.uid() AND statut = 'nettoye')
    );

-- 4. Table statuts_historique
ALTER TABLE public.statuts_historique ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique de l historique des statuts" ON public.statuts_historique;
CREATE POLICY "Lecture publique de l historique des statuts"
    ON public.statuts_historique FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Insertion d historique par les utilisateurs ou triggers" ON public.statuts_historique;
CREATE POLICY "Insertion d historique par les utilisateurs ou triggers"
    ON public.statuts_historique FOR INSERT
    TO authenticated
    WITH CHECK (true);
