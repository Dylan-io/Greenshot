-- ==============================================================================
-- mettre_a_jour_statut.sql
-- RPC de transition de statut (en_attente → vu → traite)
-- ==============================================================================
-- POURQUOI CETTE FONCTION EXISTE
--
-- Le cycle de vie prévu (PROJET.md) est :
--     en_attente → vu → nettoye → traite
--
-- 'nettoye' est réservé au RPC soumettre_preuve_nettoyage(), qui vérifie
-- l'identité et la distance GPS ≤ 50 m.
--
-- Mais avant la correction du bug 2, les transitions 'vu' et 'traite'
-- n'étaient possibles que grâce à une politique RLS fautive qui autorisait
-- TOUT utilisateur authentifié à modifier n'importe quel signalement. Une
-- fois cette faille refermée, plus rien ne pouvait faire avancer le cycle :
-- les signalements restaient bloqués indéfiniment à 'en_attente'.
--
-- Cette RPC restaure le cycle avec des transitions explicites, vérifiées et
-- auditées. L'historisation reste automatique (trigger handle_statut_change).

CREATE OR REPLACE FUNCTION public.mettre_a_jour_statut(
    p_signalement_id UUID,
    p_nouveau_statut TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_signalement public.signalements%ROWTYPE;
    v_autorise BOOLEAN := false;
BEGIN
    -- 1. Authentification obligatoire
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentification requise.';
    END IF;

    -- 2. Seuls 'vu' et 'traite' passent par cette RPC.
    --    'nettoye' est exclusivement réservé au RPC de nettoyage : c'est ce
    --    qui garantit qu'on ne peut pas simuler un nettoyage sans preuve.
    IF p_nouveau_statut NOT IN ('vu', 'traite') THEN
        RAISE EXCEPTION 'Transition invalide : "%". Seul le nettoyage validé peut passer un signalement à "nettoye".', p_nouveau_statut;
    END IF;

    -- 3. Le signalement doit exister
    SELECT * INTO v_signalement
    FROM public.signalements
    WHERE id = p_signalement_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Signalement introuvable.';
    END IF;

    -- 4. Seul le déclarant peut faire avancer son propre signalement
    IF v_signalement.user_id <> v_uid THEN
        RAISE EXCEPTION 'Seul le déclarant peut mettre à jour le statut de son signalement.';
    END IF;

    -- 5. Transitions autorisées, dans un seul sens, sans sauter d'étape.
    --    'nettoye' n'est pas une destination possible ici, et rien ne
    --    redescend de 'traite' vers 'en_attente' : la timeline reste
    --    monotone et cohérente.
    v_autorise := CASE
        WHEN v_signalement.statut = 'en_attente' AND p_nouveau_statut = 'vu'    THEN true
        WHEN v_signalement.statut = 'en_attente' AND p_nouveau_statut = 'traite' THEN true
        WHEN v_signalement.statut = 'vu'         AND p_nouveau_statut = 'traite' THEN true
        ELSE false
    END;

    IF NOT v_autorise THEN
        RAISE EXCEPTION 'Transition impossible de "%" vers "%".', v_signalement.statut, p_nouveau_statut;
    END IF;

    -- 6. Mise à jour (l'historique est écrit par le trigger)
    UPDATE public.signalements
    SET statut = p_nouveau_statut
    WHERE id = p_signalement_id;

    RETURN jsonb_build_object(
        'success', true,
        'ancien_statut', v_signalement.statut,
        'nouveau_statut', p_nouveau_statut
    );
END;
$$;

-- 7. Permissions : utilisateurs authentifiés uniquement, jamais les anonymes.
REVOKE EXECUTE ON FUNCTION public.mettre_a_jour_statut(UUID, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.mettre_a_jour_statut(UUID, TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.mettre_a_jour_statut(UUID, TEXT) FROM anon;
