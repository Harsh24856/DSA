-- DSA Daily cloud sync (Supabase project "dsa-daily").
-- One row holds the whole progress state. There is no sign-in: the browser sends a
-- sync key, and only its SHA-256 hash is stored. The first key ever used claims the row;
-- every other key is rejected. The table has RLS with no policies, so anon can reach it
-- only through dsa_sync().

create table if not exists public.dsa_state (
  key_hash   text primary key,
  done       jsonb not null default '{}'::jsonb,
  quota      jsonb not null default '{"L":2,"S":1,"C":2}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.dsa_state enable row level security;
revoke all on public.dsa_state from anon, authenticated;

-- Applies one device's changes and returns the merged state.
-- p_set: {"<row index>": {...tick}} to add/replace, p_del: row indexes to untick,
-- p_quota: new quota or null. Empty arguments make this a plain pull.
create or replace function public.dsa_sync(
  p_key text, p_set jsonb default '{}'::jsonb, p_del text[] default '{}', p_quota jsonb default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  h text;
  r public.dsa_state;
begin
  if p_key is null or length(p_key) < 8 then
    raise exception 'sync key must be at least 8 characters';
  end if;
  h := encode(sha256(convert_to(p_key, 'UTF8')), 'hex');

  -- first key ever used claims the row
  insert into public.dsa_state (key_hash)
  select h where not exists (select 1 from public.dsa_state);

  update public.dsa_state
     set done = (done - coalesce(p_del, '{}')) || coalesce(p_set, '{}'::jsonb),
         quota = coalesce(p_quota, quota),
         updated_at = case when p_set <> '{}'::jsonb or cardinality(p_del) > 0 or p_quota is not null
                           then now() else updated_at end
   where key_hash = h
  returning * into r;

  if not found then
    raise exception 'wrong sync key';
  end if;
  return jsonb_build_object('done', r.done, 'quota', r.quota, 'updated_at', r.updated_at);
end;
$$;

revoke all on function public.dsa_sync(text, jsonb, text[], jsonb) from public;
grant execute on function public.dsa_sync(text, jsonb, text[], jsonb) to anon;
