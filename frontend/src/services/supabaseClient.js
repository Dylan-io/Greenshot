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

const safeUrl = supabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co'
const safeKey = supabaseConfigured ? supabaseAnonKey : 'placeholder-key'

export const supabase = createClient(safeUrl, safeKey)

