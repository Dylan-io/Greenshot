-- ==============================================================================
-- 003_create_signalements.sql
-- Table principale des signalements et preuves de nettoyage (avec PostGIS)
-- ==============================================================================

-- Activation de l'extension spatiale PostGIS si non présente
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS public.signalements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    categorie_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    photo_avant_url TEXT NOT NULL,
    photo_apres_url TEXT,
    nettoye_par_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    date_nettoyage TIMESTAMPTZ,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ) STORED,
    description TEXT,
    statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'vu', 'nettoye', 'traite')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index spatial et index de filtrage pour des requêtes rapides sur la carte
CREATE INDEX IF NOT EXISTS idx_signalements_location ON public.signalements USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_signalements_statut ON public.signalements (statut);
CREATE INDEX IF NOT EXISTS idx_signalements_categorie ON public.signalements (categorie_id);
CREATE INDEX IF NOT EXISTS idx_signalements_user ON public.signalements (user_id);
CREATE INDEX IF NOT EXISTS idx_signalements_nettoyeur ON public.signalements (nettoye_par_user_id);
