-- Corrige les alertes SSL du heartbeat en rafale (une par passage au lieu d'une
-- seule au moment du changement d'etat). A executer une fois dans Supabase SQL Editor.

alter table domains add column if not exists was_ssl_valid boolean;
