-- ==============================================================================
-- 004_create_statuts_historique.sql
-- Table d'historisation de l'évolution des statuts pour la timeline
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.statuts_historique (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signalement_id UUID NOT NULL REFERENCES public.signalements(id) ON DELETE CASCADE,
    ancien_statut TEXT,
    nouveau_statut TEXT NOT NULL CHECK (nouveau_statut IN ('en_attente', 'vu', 'nettoye', 'traite')),
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index pour charger rapidement la timeline d'un signalement
CREATE INDEX IF NOT EXISTS idx_statuts_historique_signalement ON public.statuts_historique (signalement_id, date ASC);
