-- ==============================================================================
-- 002_create_categories.sql
-- Table des catégories de problèmes environnementaux avec barème de points
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL UNIQUE,
    points_signalement INTEGER NOT NULL DEFAULT 10 CHECK (points_signalement > 0),
    points_nettoyage INTEGER NOT NULL DEFAULT 30 CHECK (points_nettoyage > points_signalement)
);

-- Données initiales de référence pour CleanShoot Burundi
INSERT INTO public.categories (nom, points_signalement, points_nettoyage)
VALUES 
    ('Déchets plastiques', 10, 30),
    ('Décharge sauvage', 15, 45),
    ('Pollution eau', 20, 50),
    ('Déforestation', 20, 60),
    ('Autre', 10, 25)
ON CONFLICT (nom) DO NOTHING;
