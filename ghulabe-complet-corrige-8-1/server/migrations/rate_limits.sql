-- Rate limiting persistant (remplace le cache en mémoire qui se réinitialisait
-- à chaque redéploiement Render). À exécuter une seule fois dans Supabase SQL Editor.

create table if not exists rate_limits (
  limiter_key text primary key,
  count integer not null default 1,
  window_end timestamptz not null
);

create or replace function increment_rate_limit(p_key text, p_window_ms integer, p_now timestamptz)
returns table(count integer, window_end timestamptz) as $$
declare
  v_count integer;
  v_window_end timestamptz;
begin
  insert into rate_limits (limiter_key, count, window_end)
  values (p_key, 1, p_now + (p_window_ms || ' milliseconds')::interval)
  on conflict (limiter_key) do update
    set count = case
        when rate_limits.window_end <= p_now then 1
        else rate_limits.count + 1
      end,
      window_end = case
        when rate_limits.window_end <= p_now then p_now + (p_window_ms || ' milliseconds')::interval
        else rate_limits.window_end
      end
  returning rate_limits.count, rate_limits.window_end into v_count, v_window_end;

  return query select v_count, v_window_end;
end;
$$ language plpgsql;
