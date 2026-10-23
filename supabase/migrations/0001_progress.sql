-- DSA Daily: per-user progress records.
-- Paste into the Supabase SQL editor (or run with `supabase db push`). Safe to run once on a new project.
--
-- solves        current state: one row per solved problem (what the site shows)
-- settings      one row per user: daily minimums and the "first seen" dates behind the "From Mon" tag
-- solve_events  append-only history of every tick, untick, revisit and edit, so nothing is ever lost
--
-- problem_index is the row position in lib/problems.ts (that file is append-only, so indexes are stable).

create table if not exists public.solves (
  user_id       uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  problem_index integer     not null check (problem_index >= 0),
  solved_on     date        not null,
  how           text        not null default 's' check (how in ('s', 'h', 'e')), -- solo / hint / editorial
  revisits      smallint    not null default 0 check (revisits between 0 and 3),
  note          text        check (char_length(note) <= 200),
  solved_at     timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (user_id, problem_index)
);

create table if not exists public.settings (
  user_id    uuid        primary key default auth.uid() references auth.users (id) on delete cascade,
  quota      jsonb       not null default '{"L":2,"S":1,"wL":3,"wS":2,"C":2}'::jsonb,
  seen       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.solve_events (
  id            bigint      generated always as identity primary key,
  user_id       uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  problem_index integer     not null check (problem_index >= 0),
  action        text        not null check (action in ('solved', 'unsolved', 'revisited', 'updated')),
  details       jsonb,
  at            timestamptz not null default now()
);
create index if not exists solve_events_user_at on public.solve_events (user_id, at desc);

-- Row level security: every row belongs to the signed-in user, and only to them.
alter table public.solves       enable row level security;
alter table public.settings     enable row level security;
alter table public.solve_events enable row level security;

create policy "own solves: read"   on public.solves for select to authenticated using ((select auth.uid()) = user_id);
create policy "own solves: add"    on public.solves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own solves: change" on public.solves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own solves: remove" on public.solves for delete to authenticated using ((select auth.uid()) = user_id);

create policy "own settings: read"   on public.settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "own settings: add"    on public.settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own settings: change" on public.settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- History is append-only: users can read and add their events, never edit or delete them.
create policy "own events: read" on public.solve_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "own events: add"  on public.solve_events for insert to authenticated with check ((select auth.uid()) = user_id);

-- Keep updated_at honest regardless of what the client sends.
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger solves_touch   before update on public.solves   for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings for each row execute function public.touch_updated_at();
