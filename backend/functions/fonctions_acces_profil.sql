-- ==============================================================================
-- fonctions_acces_profil.sql
-- Fonctions d'accès à la PII du profil (email, téléphone, email_verified)
-- ==============================================================================
-- POURQUOI CES FONCTIONS EXISTENT
--
-- Les colonnes `email` et `phone` de `profiles` ne sont volontairement PAS
-- accordées au rôle `anon` ni à `authenticated` : sinon, la clé anon de
-- l'application (qui est publique, embarquée dans le JS) suffirait à lire
-- les coordonnées de tous les citoyens, sans même créer un compte.
--
-- Mais l'application a besoin de trois choses que ces restrictions bloquent :
--
--   1. Afficher SON PROFIL (email, téléphone, statut de vérification)
--      → obtenir_mon_profil()
--
--   2. Se connecter par NOM D'UTILISATEUR alors que Supabase Auth ne connaît
--      que l'email
--      → obtenir_email_par_username()
--
--   3. Vérifier dans une politique RLS si l'email de l'appelant est vérifié
--      → utilisateur_email_verifie()
--
-- Chacune ne renvoie que le strict nécessaire, et uniquement pour l'appelant.

-- ==============================================================================
-- 1. Son propre profil complet
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.obtenir_mon_profil()
RETURNS TABLE (
    id                UUID,
    nom               TEXT,
    ville             TEXT,
    username          TEXT,
    phone             TEXT,
    email             TEXT,
    email_verified    BOOLEAN,
    score_signalement INTEGER,
    score_nettoyage   INTEGER,
    created_at        TIMESTAMPTZ
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

-- ==============================================================================
-- 2. Résolution username → email (connexion par nom d'utilisateur)
-- ==============================================================================
-- ⚠️ Accessible à `anon` : la connexion précède l'authentification.
--    Cela autorise l'énumération d'emails à partir d'usernames connus.
--    C'est inhérent à la connexion par username, donc assumé — mais si le
--    trafic grossit, prévoir un rate limit devant la page de connexion.
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

-- ==============================================================================
-- 3. L'email de l'appelant est-il vérifié ?
-- ==============================================================================
-- Utilisée par la politique RLS d'insertion sur `signalements`.
-- Elle ne peut pas lire `email_verified` directement : la politique
-- s'exécute avec les droits du rôle client, qui n'a pas accès à cette
-- colonne. Passer par une fonction SECURITY DEFINER évite d'ouvrir la
-- colonne à tout le monde.
CREATE OR REPLACE FUNCTION public.utilisateur_email_verifie()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        (SELECT p.email_verified FROM public.profiles p WHERE p.id = auth.uid()),
        false
    );
$$;

-- ==============================================================================
-- Permissions
-- ==============================================================================
-- PUBLIC n'exécute rien : Postgres accorde EXECUTE par défaut à PUBLIC sur
-- toute nouvelle fonction, ce qui exposerait ces fonctions à n'importe quel
-- visiteur via POST /rest/v1/rpc/<nom>.
REVOKE EXECUTE ON FUNCTION public.obtenir_mon_profil()             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.obtenir_email_par_username(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.utilisateur_email_verifie()      FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.obtenir_mon_profil()             TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtenir_email_par_username(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.utilisateur_email_verifie()      TO authenticated;

-- obtenir_mon_profil n'a rien à faire pour un visiteur non connecté
REVOKE EXECUTE ON FUNCTION public.obtenir_mon_profil()             FROM anon;
REVOKE EXECUTE ON FUNCTION public.utilisateur_email_verifie()      FROM anon;

-- ⚠️ PIEGE À CONNAÎTRE
-- Si un `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON
-- FUNCTIONS TO anon, authenticated` a été exécuté (c'est le comportement
-- par défaut sur certains projets), alors TOUTE fonction créée ensuite
-- récupère automatiquement EXECUTE pour `anon` ET `authenticated` — et le
-- `REVOKE ... FROM anon` doit être rejoué après chaque `CREATE OR REPLACE
-- FUNCTION` ajouté dans cette liste, sinon il est silencieusement rouvert.
-- Le symétriquement du GRANT est trompeur : un simple
-- `GRANT ... TO authenticated` ne suffit pas à protéger une fonction,
-- et un `REVOKE ... FROM PUBLIC` seul ne suffit pas non plus.
--
-- Contrôle à lancer après toute nouvelle fonction :
--   select has_function_privilege('anon','public.<nom>()','EXECUTE');  -- doit être false
