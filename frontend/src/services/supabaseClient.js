import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('VOTRE_')
)

if (!supabaseConfigured) {
  console.warn('⚠️ Supabase URL ou clé Anon manquante. Veuillez renseigner le fichier frontend/.env')
}

// Sans configuration valide, on pointe vers une URL placeholder plutôt que
// vers une chaîne vide : createClient() lève sinon une erreur au chargement
// du module et l'écran blanc au démarrage de l'application.
const safeUrl = supabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co'
const safeKey = supabaseConfigured ? supabaseAnonKey : 'placeholder-key'

export const supabase = createClient(safeUrl, safeKey)
