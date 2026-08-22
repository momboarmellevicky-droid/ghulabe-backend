-- Colonnes nécessaires au heartbeat rapide (surveillance rapprochée Gardien).
-- À exécuter une seule fois dans Supabase SQL Editor.

alter table domains add column if not exists content_hash text;
alter table domains add column if not exists was_online boolean;
alter table domains add column if not exists last_heartbeat_at timestamptz;
