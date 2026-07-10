import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[GHULABE] Configuration Supabase manquante. ' +
    'Vérifie que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont bien réglées ' +
    'dans les variables d\'environnement du service Render (frontend).'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
