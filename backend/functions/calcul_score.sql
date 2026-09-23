-- ==============================================================================
-- calcul_score.sql
-- Trigger d'attribution automatique des points lors de la création d'un signalement
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_nouveau_signalement()
RETURNS TRIGGER AS $$
DECLARE
    v_points_signalement INTEGER;
BEGIN
    -- 1. Récupérer les points de signalement associés à la catégorie
    SELECT points_signalement INTO v_points_signalement
    FROM public.categories
    WHERE id = NEW.categorie_id;

    IF v_points_signalement IS NULL THEN
        v_points_signalement := 10;
    END IF;

    -- 2. Incrémenter le score_signalement de l'auteur
    UPDATE public.profiles
    SET score_signalement = score_signalement + v_points_signalement
    WHERE id = NEW.user_id;

    -- 3. Historiser le statut initial dans statuts_historique
    INSERT INTO public.statuts_historique (signalement_id, ancien_statut, nouveau_statut, date)
    VALUES (NEW.id, NULL, NEW.statut, NEW.created_at);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_signalement_created ON public.signalements;
CREATE TRIGGER on_signalement_created
    AFTER INSERT ON public.signalements
    FOR EACH ROW EXECUTE FUNCTION public.handle_nouveau_signalement();
