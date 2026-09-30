-- ==============================================================================
-- rls_policies.sql
-- Politiques Row Level Security (RLS) + permissions colonnes pour Greenshot
-- Version V1.1 — Correctifs de sécurité (6 bugs corrigés, voir AGENT.md §Sécurité)
-- ==============================================================================
-- PRINCIPE DIRECTEUR
-- On ne se contente pas des politiques RLS (qui filtrent les LIGNES) : on
-- restreint aussi les droits au niveau des COLONNES (Postgres le permet).
-- C'est indispensable ici, car une politique RLS ne peut pas empêcher
-- d'écrire dans score_signalement : elle ne voit que la ligne, pas la colonne.
--
-- Ordre d'application : ce fichier DOIT être appliqué après les migrations et
-- après les fonctions SQL (il GRANT l'EXECUTE sur les RPC).
-- ==============================================================================


-- ##############################################################################
-- SECTION 0 — Permissions de colonnes
-- ##############################################################################
-- On repart d'une base propre : aucun droit par défaut pour les clients.
REVOKE ALL ON public.profiles           FROM anon, authenticated;
REVOKE ALL ON public.categories          FROM anon, authenticated;
REVOKE ALL ON public.signalements        FROM anon, authenticated;
REVOKE ALL ON public.statuts_historique  FROM anon, authenticated;

-- ---- profiles -------------------------------------------------------------
-- Colonnes publiques (visibles par tous, y compris anonymes :Needed pour
-- le leaderboard et l'affichage du nom du déclarant sur la carte).
-- VOLONTAIREMENT ABSENTES : email, phone  →  correction du bug 3 (fuite de PII)
GRANT SELECT (id, nom, ville, username, score_signalement, score_nettoyage, created_at)
    ON public.profiles TO anon, authenticated;

-- Un utilisateur peut modifier son profil, MAIS PAS ses scores.
-- C'est la correction du bug 1 : sans cette restriction, n'importe quel
-- utilisateur connecté pouvait faire
--   profiles.update({ score_nettoyage: 999999 }).eq('id', monId)
-- et passer premier au classement. Les scores ne sont modifiables que par
-- les triggers SECURITY DEFINER (handle_nouveau_signalement,
-- soumettre_preuve_nettoyage), qui ne passent pas par ces droits.
GRANT UPDATE (nom, ville, phone, username)
    ON public.profiles TO authenticated;

-- ---- categories -----------------------------------------------------------
-- Table de référence : lecture seule, alimentée par la migration 002.
GRANT SELECT ON public.categories TO anon, authenticated;

-- ---- signalements ---------------------------------------------------------
-- Lecture publique (carte, timeline, historique de profil).
-- Aucun DELETE : la suppression n'est pas une fonctionnalité de la V1.0.
GRANT SELECT ON public.signalements TO anon, authenticated;

-- Insertion restreinte colonne par colonne. Le frontend ne fournit que ces
-- champs : il ne peut donc PAS insérer directement un signalement avec
-- statut='nettoye' ou se déclarer nettoyeur, ce qui contournerait le
-- contrôle anti-fraude géodésique.
GRANT INSERT (user_id, categorie_id, photo_avant_url, latitude, longitude, ville, description)
    ON public.signalements TO authenticated;

-- Mise à jour : le déclarant ne peut corriger QUE sa description.
-- Le statut, les photos, la géolocalisation et les identifiants de nettoyage
-- passent obligatoirement par le RPC soumettre_preuve_nettoyage(), qui
-- vérifie l'identité et la distance ≤ 50 m. C'est la correction du bug 2.
GRANT UPDATE (description)
    ON public.signalements TO authenticated;

-- ---- statuts_historique ---------------------------------------------------
-- Lecture seulement. L'écriture est réservée aux triggers (correction du bug 5a).
GRANT SELECT ON public.statuts_historique TO anon, authenticated;


-- ##############################################################################
-- SECTION 1 — Fonctions de lecture sécurisée de la PII
-- ##############################################################################
-- Avec les permissions de colonnes ci-dessus, un utilisateur ne peut plus lire
-- son propre email/téléphone via un simple SELECT. On expose donc deux fonctions
-- SECURITY DEFINER qui renvoient uniquement ce dont l'appelant a legitimately
-- besoin.

-- 1a) Son propre profil complet (email, phone, email_verified inclus).
CREATE OR REPLACE FUNCTION public.obtenir_mon_profil()
RETURNS TABLE (
    id              UUID,
    nom             TEXT,
    ville           TEXT,
    username        TEXT,
    phone           TEXT,
    email           TEXT,
    email_verified  BOOLEAN,
    score_signalement INTEGER,
    score_nettoyage   INTEGER,
    created_at      TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT p.id, p.nom, p.ville, p.username, p.phone, p.email,
           p.email_verified, p.score_signalement, p.score_nettoyage, p.created_at
    FROM public.profiles p
    WHERE p.id = auth.uid();
$$;

-- 1b) Résolution username → email pour la connexion par nom d'utilisateur.
-- Supabase Auth ne connaît que l'email : le frontend doit retrouver l'email
-- associé à un username avant d'appeler signInWithPassword.
-- ⚠️ Cette fonction est accessible à anon (la connexion précède l'authentification)
--    ce qui autorise l'énumération d'emails à partir d'usernames connus.
--    C'est inhérent à la connexion par username. À surveiller : si le trafic
--    devient important, ajouter un rate limit devant /login.
CREATE OR REPLACE FUNCTION public.obtenir_email_par_username(p_username TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT p.email
    FROM public.profiles p
    WHERE p.username = lower(trim(p_username))
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.obtenir_mon_profil()            TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtenir_email_par_username(TEXT) TO anon, authenticated;


-- ##############################################################################
-- SECTION 2 — RLS : table profiles
-- ##############################################################################
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Lecture publique : limitée aux colonnes accordées en SECTION 0.
DROP POLICY IF EXISTS "Lecture publique des profils" ON public.profiles;
CREATE POLICY "Lecture publique des profils"
    ON public.profiles FOR SELECT
    USING (true);

-- Modification : chaque utilisateur ne modifie que son propre profil.
-- Les colonnes modifiables sont déjà restreintes par le GRANT de la SECTION 0
-- (nom, ville, phone, username) — les scores sont hors de portée.
DROP POLICY IF EXISTS "Modification de son propre profil" ON public.profiles;
CREATE POLICY "Modification de son propre profil"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);


-- ##############################################################################
-- SECTION 3 — RLS : table categories
-- ##############################################################################
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique des categories" ON public.categories;
CREATE POLICY "Lecture publique des categories"
    ON public.categories FOR SELECT
    USING (true);


-- ##############################################################################
-- SECTION 4 — RLS : table signalements
-- ##############################################################################
ALTER TABLE public.signalements ENABLE ROW LEVEL SECURITY;

-- Lecture publique : tout le monde peut voir les signalements (carte, détail).
DROP POLICY IF EXISTS "Lecture publique de tous les signalements" ON public.signalements;
CREATE POLICY "Lecture publique de tous les signalements"
    ON public.signalements FOR SELECT
    USING (true);

-- Insertion : l'utilisateur doit être authentifié ET avoir vérifié son email,
-- ET ne crée le signalement que pour lui-même.
-- BUG 2 : l'ancienne version de cette politique autorisait TOUT utilisateur
-- authentifié à mettre à jour n'importe quel signalement en attente/vu, ce qui
-- permettait d'altérer la géolocalisation et la photo servant de preuve.
DROP POLICY IF EXISTS "Creation de signalement par utilisateur authentifie" ON public.signalements;
CREATE POLICY "Creation de signalement par utilisateur authentifie"
    ON public.signalements FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = user_id
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND email_verified = true
        )
    );

-- Mise à jour : UNIQUEMENT le déclarant, sur son propre signalement.
-- Le GRANT de la SECTION 0 ne lui laisse de toute façon que la colonne
-- `description`. Le nettoyage, lui, passe par le RPC.
DROP POLICY IF EXISTS "Modification par le declarant" ON public.signalements;
CREATE POLICY "Modification par le declarant"
    ON public.signalements FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);


-- ##############################################################################
-- SECTION 5 — RLS : table statuts_historique
-- ##############################################################################
ALTER TABLE public.statuts_historique ENABLE ROW LEVEL SECURITY;

-- Lecture publique : la timeline de DetailSignalement.vue en dépend.
DROP POLICY IF EXISTS "Lecture publique de l historique des statuts" ON public.statuts_historique;
CREATE POLICY "Lecture publique de l historique des statuts"
    ON public.statuts_historique FOR SELECT
    USING (true);

-- BUG 5a : la politique suivante autorisait n'importe quel utilisateur
-- authentifié à insérer n'importe quelle ligne d'historique (WITH CHECK (true)),
-- ce qui rendait la timeline entièrement falsifiable. Elle est SUPPRIMÉE.
-- L'écriture se fait uniquement via les triggers SECURITY DEFINER
-- (handle_nouveau_signalement, handle_statut_change), qui contournent le RLS.
DROP POLICY IF EXISTS "Insertion d historique par les utilisateurs ou triggers" ON public.statuts_historique;


-- ##############################################################################
-- SECTION 6 — RLS : table categories en écriture (réservé au seed)
-- ##############################################################################
-- categories n'est alimentée QUE par la migration 002 (exécutée avec les
-- droits postgres). Aucune politique d'écriture n'est ouverte au client.


-- ##############################################################################
-- SECTION 7 — Permissions d'exécution des fonctions
-- ##############################################################################
-- ⚠️ POINT CRITIQUE, source d'une faille facile à rater.
-- Postgres accorde EXECUTE sur toute nouvelle fonction au rôle PUBLIC.
-- Sans ce REVOKE, un visiteur non connecté pouvait appeler les fonctions
-- SECURITY DEFINER via POST /rest/v1/rpc/<nom> (advisors Supabase 0028/0029).
-- On révoque donc PUBLIC en PREMIER, puis on ré-accorde uniquement ce dont
-- le frontend a réellement besoin.

REVOKE EXECUTE ON FUNCTION public.handle_new_user()                 FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_email_verification_update() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_nouveau_signalement()      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_statut_change()            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_username(TEXT, UUID)     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.soumettre_preuve_nettoyage(UUID, TEXT, NUMERIC, NUMERIC) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.obtenir_classement(TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.obtenir_mon_profil()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.obtenir_email_par_username(TEXT)  FROM PUBLIC;

-- Les 4 fonctions de trigger n'ont aucune vocation à être appelées par un
-- client : elles ne sont accessibles à personne, seulement à la base.
REVOKE ALL ON FUNCTION public.handle_new_user()                 FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_email_verification_update() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_nouveau_signalement()      FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_statut_change()            FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_username(TEXT, UUID)     FROM anon, authenticated;

-- RPC réellement appelées par le frontend
GRANT EXECUTE ON FUNCTION public.soumettre_preuve_nettoyage(UUID, TEXT, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtenir_classement(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obtenir_mon_profil()            TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtenir_email_par_username(TEXT) TO anon, authenticated;

-- Supabase accorde EXECUTE à `anon` ET `authenticated` par défaut, en un seul
-- GRANT groupé : un GRANT « TO authenticated » laisse donc `anon` passer aussi.
-- Il faut révoquer explicitement. Vérifié sur le projet Greenshot :
--   has_function_privilege('anon', 'obtenir_mon_profil()', 'EXECUTE') = true
--   → corrigé à false par le REVOKE ci-dessous.
REVOKE EXECUTE ON FUNCTION public.obtenir_mon_profil() FROM anon;
REVOKE EXECUTE ON FUNCTION public.soumettre_preuve_nettoyage(UUID, TEXT, NUMERIC, NUMERIC) FROM anon;

-- Même règle pour toutes les fonctions créées ultérieurement : PUBLIC n'hérite
-- de plus automatiquement du droit d'exécution.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
