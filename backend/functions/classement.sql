-- ==============================================================================
-- classement.sql
-- Fonction RPC pour le leaderboard citoyen (Global et par Ville)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.obtenir_classement(
    p_ville TEXT DEFAULT NULL,
    p_limite INTEGER DEFAULT 50
)
RETURNS TABLE (
    rang BIGINT,
    id UUID,
    nom TEXT,
    ville TEXT,
    score_signalement INTEGER,
    score_nettoyage INTEGER,
    score_total INTEGER
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        DENSE_RANK() OVER (ORDER BY (p.score_signalement + p.score_nettoyage) DESC, p.score_nettoyage DESC) AS rang,
        p.id,
        p.nom,
        p.ville,
        p.score_signalement,
        p.score_nettoyage,
        (p.score_signalement + p.score_nettoyage) AS score_total
    FROM public.profiles p
    WHERE (p_ville IS NULL OR p.ville = p_ville)
      AND (p.score_signalement + p.score_nettoyage) > 0
    ORDER BY score_total DESC, p.score_nettoyage DESC
    LIMIT p_limite;
$$;
