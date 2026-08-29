-- Migration : boutons de certification/rejet directement dans l'email admin
-- À exécuter dans Supabase (SQL Editor) avant le déploiement du code.

ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_approve_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_reject_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_action_token_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_admin_approve_token ON users(admin_approve_token) WHERE admin_approve_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_admin_reject_token ON users(admin_reject_token) WHERE admin_reject_token IS NOT NULL;
