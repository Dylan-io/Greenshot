-- ==============================================================================
-- 001_create_profiles.sql
-- Table des profils utilisateurs liée à auth.users de Supabase
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL DEFAULT 'Citoyen',
    ville TEXT DEFAULT 'Bujumbura',
    score_signalement INTEGER NOT NULL DEFAULT 0 CHECK (score_signalement >= 0),
    score_nettoyage INTEGER NOT NULL DEFAULT 0 CHECK (score_nettoyage >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index pour accélérer le classement
CREATE INDEX IF NOT EXISTS idx_profiles_score ON public.profiles ((score_signalement + score_nettoyage) DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_ville ON public.profiles (ville);

-- Trigger pour créer automatiquement une ligne profile lors de la création d'un utilisateur Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nom, ville, score_signalement, score_nettoyage)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nom', 'Citoyen ' || substr(NEW.id::text, 1, 6)),
        COALESCE(NEW.raw_user_meta_data->>'ville', 'Bujumbura'),
        0,
        0
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
