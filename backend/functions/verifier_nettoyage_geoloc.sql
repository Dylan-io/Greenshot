-- ==============================================================================
-- verifier_nettoyage_geoloc.sql
-- Fonction RPC de soumission et vérification géographique anti-fraude d'un nettoyage
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.soumettre_preuve_nettoyage(
    p_signalement_id UUID,
    p_photo_apres_url TEXT,
    p_latitude NUMERIC,
    p_longitude NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_signalement public.signalements%ROWTYPE;
    v_nettoyeur_id UUID := auth.uid();
    v_distance DOUBLE PRECISION;
    v_points_nettoyage INTEGER;
    v_ancien_statut TEXT;
BEGIN
    -- 1. Vérifier l'authentification de l'utilisateur
    IF v_nettoyeur_id IS NULL THEN
        RAISE EXCEPTION 'Authentification requise pour soumettre un nettoyage.';
    END IF;

    -- 2. Récupérer le signalement cible
    SELECT * INTO v_signalement
    FROM public.signalements
    WHERE id = p_signalement_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Signalement introuvable.';
    END IF;

    -- 3. Vérifier que le signalement n'est pas déjà nettoyé ou traité
    IF v_signalement.statut IN ('nettoye', 'traite') THEN
        RAISE EXCEPTION 'Ce signalement a déjà été nettoyé ou traité.';
    END IF;

    -- 4. Calcul de la distance géodésique avec PostGIS (en mètres)
    v_distance := ST_Distance(
        v_signalement.location,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    );

    -- 5. Règle anti-fraude : distance maximale autorisée de 50 mètres
    IF v_distance > 50.0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Position trop éloignée. Vous êtes à ' || round(v_distance::numeric, 1)::text || ' m du lieu (maximum autorisé: 50 m).',
            'distance', round(v_distance::numeric, 1)
        );
    END IF;

    -- 6. Récupérer le barème de points pour cette catégorie
    SELECT points_nettoyage INTO v_points_nettoyage
    FROM public.categories
    WHERE id = v_signalement.categorie_id;

    IF v_points_nettoyage IS NULL THEN
        v_points_nettoyage := 30; -- Valeur par défaut
    END IF;

    v_ancien_statut := v_signalement.statut;

    -- 7. Mettre à jour le signalement
    UPDATE public.signalements
    SET 
        photo_apres_url = p_photo_apres_url,
        nettoye_par_user_id = v_nettoyeur_id,
        date_nettoyage = timezone('utc'::text, now()),
        statut = 'nettoye'
    WHERE id = p_signalement_id;

    -- 8. Historiser le statut dans statuts_historique
    INSERT INTO public.statuts_historique (signalement_id, ancien_statut, nouveau_statut, date)
    VALUES (p_signalement_id, v_ancien_statut, 'nettoye', timezone('utc'::text, now()));

    -- 9. Créditer les points de nettoyage au profil du nettoyeur
    UPDATE public.profiles
    SET score_nettoyage = score_nettoyage + v_points_nettoyage
    WHERE id = v_nettoyeur_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Preuve de nettoyage validée avec succès !',
        'points_gagnes', v_points_nettoyage,
        'distance', round(v_distance::numeric, 1)
    );
END;
$$;
