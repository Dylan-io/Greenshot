-- ==============================================================================
-- historiser_statut.sql
-- BUG 5b : historisation automatique de TOUS les changements de statut
-- ==============================================================================
-- Avant ce trigger, l'historique n'était écrit qu'à deux endroits : la création
-- du signalement (on_signalement_created) et le RPC soumettre_preuve_nettoyage.
-- Les transitions en_attente → vu et → traite n'étaient donc JAMAIS enregistrées,
-- ce qui laissait des trous dans la timeline de DetailSignalement.vue.
--
-- Ce trigger centralise l'historisation : toute modification effective du
-- statut produit exactement une ligne dans statuts_historique.

CREATE OR REPLACE FUNCTION public.handle_statut_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Ne rien écrire si le statut n'a pas réellement changé
    IF NEW.statut IS DISTINCT FROM OLD.statut THEN
        INSERT INTO public.statuts_historique (
            signalement_id, ancien_statut, nouveau_statut, date
        )
        VALUES (NEW.id, OLD.statut, NEW.statut, timezone('utc'::text, now()));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_signalement_statut_change ON public.signalements;
CREATE TRIGGER on_signalement_statut_change
    AFTER UPDATE OF statut ON public.signalements
    FOR EACH ROW EXECUTE FUNCTION public.handle_statut_change();
