-- ==============================================================================
-- 006_username_management.sql
-- Gestion du nom d'utilisateur : unicité, validation, changement à la demande
-- ==============================================================================
-- POURQUOI CE FICHIER EXISTE
--
-- Parcours souhaité par l'équipe :
--   1. L'utilisateur s'inscrit.
--   2. La base génère automatiquement un username (aline_4829).
--   3. L'utilisateur VOIT ce nom généré sur son profil.
--   4. Il peut le CHANGER s'il le souhaite.
--   5. Il valide. La modification est enregistrée en base.
--
-- Avant ce fichier, l'étape 4 était impossible à faire proprement :
--   - la seule garantie d'unicité venait de la contrainte UNIQUE, qui
--     renvoyait une erreur Postgres brute (23505) sans aucun message utile ;
--   - aucun contrôle de format n'existait : un username "A B C!!!" passait ;
--   - aucun nom réservé n'était bloqué ("admin", "greenshot"…) ;
--   - rien n'empêchait un username vide ou composé uniquement d'underscores.
--
-- Cette migration rend le changement possible, contrôlé et explicable.

-- ==============================================================================
-- 1. Contrainte de format au niveau de la base
-- ==============================================================================
-- Défense en profondeur : même si une écriture contourne l'API (SQL direct,
-- script d'import, futur code), la base refuse un username mal formé.
-- 3 à 30 caractères, minuscules, lettres/chiffres/underscore uniquement.
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_username_format;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_username_format
    CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,30}$');

COMMENT ON CONSTRAINT profiles_username_format ON public.profiles IS
    'Username : 3 a 30 caracteres, minuscules, lettres/chiffres/underscore uniquement.';


-- ==============================================================================
-- 2. Noms réservés
-- ==============================================================================
-- Un username est un identifiant public. Interdire les noms qui pourraient
-- faire croire a une personne officielle ou a l'application elle-meme.
CREATE TABLE IF NOT EXISTS public.usernames_reserves (
    username TEXT PRIMARY KEY,
    motif    TEXT
);

INSERT INTO public.usernames_reserves (username, motif) VALUES
    ('admin', 'administrat'),
    ('administrateur', 'administrat'),
    ('admin_greenshot', 'administrat'),
    ('root', 'systeme'),
    ('superuser', 'systeme'),
    ('sysadmin', 'systeme'),
    ('systeme', 'systeme'),
    ('greenshot', 'application'),
    ('support', 'application'),
    ('aide', 'application'),
    ('help', 'application'),
    ('officiel', 'officiel'),
    ('modérateur', 'officiel'),
    ('moderateur', 'officiel'),
    ('gouvernement', 'officiel'),
    ('null', 'invalide'),
    ('undefined', 'invalide'),
    ('none', 'invalide')
ON CONFLICT (username) DO NOTHING;

-- Lecture publique (aucune donnee sensible) : l'app peut l'afficher si besoin.
ALTER TABLE public.usernames_reserves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique des usernames reserves" ON public.usernames_reserves;
CREATE POLICY "Lecture publique des usernames reserves"
    ON public.usernames_reserves FOR SELECT
    USING (true);
GRANT SELECT ON public.usernames_reserves TO anon, authenticated;


-- ==============================================================================
-- 3. Un username est-il disponible ?
-- ==============================================================================
-- Fonction appelable par le frontend pour verifier EN DIRECT pendant la saisie,
-- avant de soumettre. Evite un aller-retour d'echec apres coup.
--
-- p_exclure_id : pour que l'utilisateur puisse conserver son propre username
-- en consultant sa disponibilite (sinon il verrait « indisponible » partout).
CREATE OR REPLACE FUNCTION public.username_est_disponible(
    p_username TEXT,
    p_exclure_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
    v_nom TEXT := lower(trim(coalesce(p_username, '')));
BEGIN
    -- Format
    IF v_nom = '' THEN
        RETURN jsonb_build_object('disponible', false, 'raison', 'vide',
            'message', 'Le nom d''utilisateur ne peut pas être vide.');
    END IF;

    IF length(v_nom) < 3 THEN
        RETURN jsonb_build_object('disponible', false, 'raison', 'trop_court',
            'message', 'Le nom d''utilisateur doit contenir au moins 3 caractères.');
    END IF;

    IF length(v_nom) > 30 THEN
        RETURN jsonb_build_object('disponible', false, 'raison', 'trop_long',
            'message', 'Le nom d''utilisateur ne peut pas dépasser 30 caractères.');
    END IF;

    IF v_nom !~ '^[a-z0-9_]+$' THEN
        RETURN jsonb_build_object('disponible', false, 'raison', 'caracteres',
            'message', 'Utilisez uniquement des lettres sans accent, des chiffres et le caractère « _ ».');
    END IF;

    -- Nom réservé
    IF EXISTS (SELECT 1 FROM public.usernames_reserves r WHERE r.username = v_nom) THEN
        RETURN jsonb_build_object('disponible', false, 'raison', 'reserve',
            'message', 'Ce nom d''utilisateur est réservé.');
    END IF;

    -- Unicité
    IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.username = v_nom AND p.id IS DISTINCT FROM p_exclure_id) THEN
        RETURN jsonb_build_object('disponible', false, 'raison', 'deja_pris',
            'message', 'Ce nom d''utilisateur est déjà pris par un autre citoyen.');
    END IF;

    RETURN jsonb_build_object('disponible', true, 'username', v_nom,
        'message', 'Ce nom d''utilisateur est disponible.');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.username_est_disponible(TEXT, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.username_est_disponible(TEXT, UUID) TO anon, authenticated;


-- ==============================================================================
-- 4. Changer son nom d'utilisateur
-- ==============================================================================
-- Appelé par le frontend quand l'utilisateur confirme le nouveau nom.
-- Retourne un message exploitable : plus d'erreur Postgres brute.
CREATE OR REPLACE FUNCTION public.changer_username(p_nouveau_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_actuel TEXT;
    v_cible TEXT := lower(trim(coalesce(p_nouveau_username, '')));
    v_ctrl JSONB;
BEGIN
    -- 1. Session obligatoire
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentification requise.';
    END IF;

    SELECT username INTO v_actuel FROM public.profiles WHERE id = v_uid;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profil introuvable.';
    END IF;

    -- 2. Contrôles de format, réservé et unicité (fonction §3)
    v_ctrl := public.username_est_disponible(v_cible, v_uid);

    IF NOT (v_ctrl->>'disponible')::boolean THEN
        RETURN jsonb_build_object(
            'success', false,
            'raison', v_ctrl->>'raison',
            'message', v_ctrl->>'message'
        );
    END IF;

    -- 3. Écriture
    UPDATE public.profiles
    SET username = v_cible
    WHERE id = v_uid;

    RETURN jsonb_build_object(
        'success', true,
        'ancien_username', v_actuel,
        'nouveau_username', v_cible,
        'message', 'Nom d''utilisateur mis à jour.'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.changer_username(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.changer_username(TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.changer_username(TEXT) FROM anon;


-- ==============================================================================
-- 5. handle_new_user : un nom vide doit compter comme un nom absent
-- ==============================================================================
-- Constat réel : un profil a été créé avec `nom = ''` et `username = citoyen_5921`.
-- COALESCE ne remplace que les NULL, pas la chaine vide : le nom vide passait
-- et le fallback 'Citoyen …' ne se déclenchait jamais.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_username TEXT;
    v_nom      TEXT;
BEGIN
    -- Nom : NULLIF traite la chaîne vide comme un nom absent
    v_nom := COALESCE(
        NULLIF(btrim(coalesce(NEW.raw_user_meta_data->>'nom', '')), ''),
        'Citoyen ' || substr(NEW.id::text, 1, 6)
    );

    -- Username : le serveur reste maître de la génération.
    -- Si l'utilisateur en a fourni un (metadata), on le valide ; sinon on génère.
    v_username := public.generate_username(NEW.raw_user_meta_data->>'nom', NEW.id);

    IF COALESCE(btrim(coalesce(NEW.raw_user_meta_data->>'username', '')), '') <> '' THEN
        IF (public.username_est_disponible(
                NEW.raw_user_meta_data->>'username', NEW.id
            )->>'disponible')::boolean
        THEN
            v_username := lower(btrim(NEW.raw_user_meta_data->>'username'));
        END IF;
        -- Sinon on conserve l'username généré : mieux vaut un nom automatique
        -- valide qu'un nom choisi mais pris ou mal formé.
    END IF;

    INSERT INTO public.profiles (
        id, nom, ville, score_signalement, score_nettoyage,
        username, phone, email, email_verified
    )
    VALUES (
        NEW.id,
        v_nom,
        COALESCE(NULLIF(btrim(coalesce(NEW.raw_user_meta_data->>'ville', '')), ''), 'Bujumbura'),
        0, 0,
        v_username,
        NEW.raw_user_meta_data->>'phone',
        NEW.email,
        (NEW.email_confirmed_at IS NOT NULL)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;


-- ==============================================================================
-- 6. generate_username : respecter lui-meme le format impose
-- ==============================================================================
-- generate_username n'appelle pas username_est_disponible, donc un nom généré
-- pouvait théoriquement contenir un caractère refusé par la nouvelle
-- contrainte de format (accent non couvert, base trop longue + suffixe > 30).
-- On rejette désormais explicitement les candidats non conformes.
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
    essais INTEGER := 0;
BEGIN
    premier_mot := split_part(trim(coalesce(p_first_name, '')), ' ', 1);
    base_username := lower(extensions.unaccent(premier_mot));
    base_username := regexp_replace(base_username, '[^a-z0-9]', '', 'g');

    IF base_username IS NULL OR base_username = '' THEN
        base_username := 'citoyen';
    END IF;

    -- 14 caractères max : laisse de la place pour "_" + 4 chiffres
    -- tout en restant sous la limite de 30 imposée par la contrainte.
    base_username := substring(base_username from 1 for 14);

    -- 20 tentatives suffisent largement : l'espace de noms est immense
    -- et la boucle de unicité est déterministe sur l'unicité réelle.
    WHILE essais < 20 LOOP
        suffix := floor(random() * 9000 + 1000)::INTEGER;
        candidate := base_username || '_' || suffix;

        IF candidate ~ '^[a-z0-9_]{3,30}$'
           AND NOT EXISTS (SELECT 1 FROM public.usernames_reserves r WHERE r.username = candidate)
           AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.username = candidate AND p.id != p_user_id)
        THEN
            RETURN candidate;
        END IF;

        essais := essais + 1;
    END IF;

    -- Repli : identifiant garanti unique par construction
    RETURN 'citoyen_' || substr(replace(p_user_id::text, '-', ''), 1, 10);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.generate_username(TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_username(TEXT, UUID) FROM anon, authenticated;


-- ==============================================================================
-- 7. Réparer les profils existants
-- ==============================================================================
-- Profils créés avant cette migration : nom vide et/ou username hors format.
UPDATE public.profiles
SET nom = 'Citoyen ' || substr(replace(id::text, '-', ''), 1, 6)
WHERE nom IS NULL OR btrim(nom) = '';

UPDATE public.profiles
SET username = 'citoyen_' || substr(replace(id::text, '-', ''), 1, 10)
WHERE username IS NULL
   OR username !~ '^[a-z0-9_]{3,30}$'
   OR username IN (SELECT username FROM public.usernames_reserves);