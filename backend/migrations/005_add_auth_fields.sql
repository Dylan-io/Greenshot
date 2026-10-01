-- ==============================================================================
-- 005_add_auth_fields.sql
-- Ajout des champs d'authentification à la table profiles
-- Génération automatique de username, vérification email, téléphone
-- ==============================================================================

-- =============================================
-- 1. Ajout des colonnes d'authentification
-- =============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Index pour recherche rapide par username et email
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- 003_create_signalements installe postgis dans le schema 'extensions' ;
-- unaccent doit être disponible pour generate_username(). `unaccent` n'est pas
-- installé par défaut sur un projet Supabase neuf.
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

-- =============================================
-- 2. Fonction de génération automatique de username
-- =============================================
-- Exemple : "Aline N." → "aline_4829"
-- Le username est unique et modifiable

-- NOTE : SET search_path verrouille la résolution de noms dans les fonctions
-- SECURITY DEFINER (protection contre le détournement via search_path).
CREATE OR REPLACE FUNCTION public.generate_username(
    p_first_name TEXT,
    p_user_id UUID
)
RETURNS TEXT AS $$
DECLARE
    base_username TEXT;
    candidate TEXT;
    suffix INTEGER;
    premier_mot TEXT;
BEGIN
    -- 1. Premier mot uniquement.
    -- Le paramètre s'appelle p_first_name et la doc annonce
    -- "Aline N." -> "aline_4829" : le "N." ne doit PAS être conservé.
    premier_mot := split_part(trim(coalesce(p_first_name, '')), ' ', 1);

    -- 2. Normaliser : accents retirés (unaccent), puis minuscules.
    --    ⚠️ L'ordre compte : le code d'origine faisait
    --       lower(regexp_replace(...)), donc la regex tournait sur du texte
    --       encore en majuscules, ne reconnaissait pas [a-z0-9], et
    --       remplaçait chaque majuscule par '_'.
    --       Résultat obtenu : "Aline Nzigire" -> "_line__zigire_8996"
    base_username := lower(extensions.unaccent(premier_mot));

    -- 3. Ne garder que les alphanumériques (suppression, pas substitution :
    --    le remplacement par '_' produisait des suites d'underscores)
    base_username := regexp_replace(base_username, '[^a-z0-9]', '', 'g');

    -- 4. Repli si le prénom ne contenait rien d'exploitable
    IF base_username = '' OR base_username IS NULL THEN
        base_username := 'citoyen';
    END IF;

    -- 5. Limiter à 20 caractères max
    base_username := substring(base_username from 1 for 20);

    -- 6. Générer un suffixe de 4 chiffres aléatoires (1000-9999)
    suffix := floor(random() * 9000 + 1000)::INTEGER;
    candidate := base_username || '_' || suffix;

    -- 7. Vérifier l'unicité : retenter si le username est déjà pris
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate AND id != p_user_id) LOOP
        suffix := floor(random() * 9000 + 1000)::INTEGER;
        candidate := base_username || '_' || suffix;
    END LOOP;

    RETURN candidate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- =============================================
-- 3. Fonction pour synchroniser email et email_verified
-- =============================================
-- Quand l'utilisateur clique sur le lien de vérification,
-- auth.users.email_confirmed_at est mis à jour automatiquement.
-- Ce trigger synchronise cette info dans profiles.email_verified.
-- BUG 6 : l'email était aussi resynchronisé, sinon un changement d'email
-- côté Auth rendait la connexion par username impossible (le profil gardait
-- l'ancien email, le signInWithPassword échouait et l'utilisateur était
-- bloqué hors de son compte).

CREATE OR REPLACE FUNCTION public.handle_email_verification_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles 
    SET email_verified = (NEW.email_confirmed_at IS NOT NULL),
        email          = NEW.email
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_email_verification_update();

-- ATTENTION : on ne touche volontairement PAS au RLS de auth.users, géré par
-- Supabase. Le trigger ci-dessus s'exécute en SECURITY DEFINER par le backend
-- (rôle postgres) et n'est donc pas soumis au RLS de la table auth.users.

-- =============================================
-- 4. Mise à jour du trigger handle_new_user()
-- =============================================
-- Remplace la fonction de 001 pour inclure toutes les nouvelles colonnes

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_username TEXT;
BEGIN
    -- Générer le username automatiquement à partir du prénom
    v_username := public.generate_username(
        NEW.raw_user_meta_data->>'nom',
        NEW.id
    );
    
    -- Insérer le profil complet avec toutes les informations d'authentification
    INSERT INTO public.profiles (
        id, 
        nom, 
        ville, 
        score_signalement, 
        score_nettoyage,
        username,
        phone,
        email,
        email_verified
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nom', 'Citoyen ' || substr(NEW.id::text, 1, 6)),
        COALESCE(NEW.raw_user_meta_data->>'ville', 'Bujumbura'),
        0,
        0,
        v_username,
        NEW.raw_user_meta_data->>'phone',
        NEW.email,
        -- IS NOT NULL renvoie déjà un booléen : le COALESCE était inutile
        (NEW.email_confirmed_at IS NOT NULL)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Recréer le trigger avec la nouvelle fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 5. Commentaire pour traçabilité
-- =============================================
COMMENT ON TABLE public.profiles IS 'Profils utilisateurs avec champs d''authentification (username, phone, email, email_verified)';
COMMENT ON COLUMN public.profiles.username IS 'Nom d''utilisateur unique, auto-généré à partir du prénom + 4 chiffres aléatoires';
COMMENT ON COLUMN public.profiles.phone IS 'Numéro de téléphone pour contact';
COMMENT ON COLUMN public.profiles.email IS 'Email utilisé pour la connexion et la vérification';
COMMENT ON COLUMN public.profiles.email_verified IS 'True si l''utilisateur a cliqué sur le lien de vérification de son email';
