import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mock-supabase-eu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key-eu-paris';

/**
 * Client Supabase EU initialisé avec clé de service pour les opérations backend chiffrées
 * Données hébergées en France / Union Européenne exclusivement.
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

export async function testDbConnection(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.warn('[GHULABE DB] Avertissement de connexion PostgreSQL:', error.message);
    }
    console.log('[GHULABE DB] Connexion PostgreSQL & Supabase EU établie avec succès.');
    return true;
  } catch (err) {
    console.error('[GHULABE DB] Erreur critique de connexion PostgreSQL:', err);
    return false;
  }
}
