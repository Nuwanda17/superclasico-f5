-- SUPERCLÁSICO F5: esquema compartido, seguridad y Realtime.
-- Ejecutar completo en Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 80),
  home_team text not null,
  away_team text not null,
  match_date timestamptz,
  venue text,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(btrim(name)) between 2 and 30),
  team text not null default 'undecided' check (team in ('cerro', 'olimpia', 'undecided')),
  preferred_position text not null default 'ALL' check (preferred_position in ('GK', 'DEF', 'MID', 'FWD', 'ALL')),
  number integer check (number between 1 and 99),
  starter boolean not null default false,
  goalkeeper boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not goalkeeper or starter)
);

create unique index if not exists players_one_profile_per_user_match
  on public.players(match_id, owner_user_id) where owner_user_id is not null;
create unique index if not exists players_one_goalkeeper_per_team
  on public.players(match_id, team) where goalkeeper and starter and team <> 'undecided';
create index if not exists players_match_team_idx on public.players(match_id, team);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  voter_user_id uuid not null references auth.users(id) on delete cascade,
  target_player_id uuid not null references public.players(id) on delete cascade,
  technique integer not null check (technique between 1 and 10),
  finishing integer not null check (finishing between 1 and 10),
  passing integer not null check (passing between 1 and 10),
  defense integer not null check (defense between 1 and 10),
  stamina integer not null check (stamina between 1 and 10),
  goalkeeping integer not null check (goalkeeping between 1 and 10),
  magic integer not null check (magic between 1 and 10),
  grit integer not null check (grit between 1 and 10),
  hype integer not null check (hype between 1 and 10),
  chaos integer not null check (chaos between 1 and 10),
  trait text check (trait is null or trait in (
    'Francotirador', 'Patrón de la defensa', 'Motorcito', 'Fantasista', 'Tractor',
    'Impredecible', 'Director técnico sin título', 'Desaparece en las difíciles',
    'Juega como si fuera una final', 'Siempre tiene algo', 'Patea aunque no corresponda',
    'No larga una', 'Ordena más de lo que juega'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (voter_user_id, target_player_id)
);
create index if not exists ratings_match_target_idx on public.ratings(match_id, target_player_id);

-- Tabla pública agregada: nunca expone el votante ni una papeleta individual.
-- Antes de 3 votos los promedios permanecen NULL para mantener la carta cerrada.
create table if not exists public.player_rating_summaries (
  target_player_id uuid primary key references public.players(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  vote_count integer not null default 0 check (vote_count >= 0),
  technique numeric(4,2),
  finishing numeric(4,2),
  passing numeric(4,2),
  defense numeric(4,2),
  stamina numeric(4,2),
  goalkeeping numeric(4,2),
  magic numeric(4,2),
  grit numeric(4,2),
  hype numeric(4,2),
  chaos numeric(4,2),
  top_trait text,
  updated_at timestamptz not null default now()
);
create index if not exists rating_summaries_match_idx on public.player_rating_summaries(match_id);

create table if not exists public.team_setups (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team text not null check (team in ('cerro', 'olimpia')),
  formation text not null default '1-2-1' check (formation in ('1-2-1', '2-1-1', '1-1-2', '2-2', 'all-up')),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (match_id, team)
);

create table if not exists public.match_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists match_results_latest_idx on public.match_results(match_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists players_touch_updated_at on public.players;
create trigger players_touch_updated_at before update on public.players
for each row execute function public.touch_updated_at();
drop trigger if exists ratings_touch_updated_at on public.ratings;
create trigger ratings_touch_updated_at before update on public.ratings
for each row execute function public.touch_updated_at();

create or replace function public.guard_player_lineup()
returns trigger language plpgsql set search_path = public as $$
declare current_starters integer;
begin
  new.name := btrim(new.name);
  if tg_op = 'UPDATE' and new.team is distinct from old.team then
    new.starter := false;
    new.goalkeeper := false;
  end if;
  if not new.starter then new.goalkeeper := false; end if;
  if new.starter then
    if new.team = 'undecided' then raise exception 'starter_requires_team'; end if;
    perform pg_advisory_xact_lock(hashtext(new.match_id::text || ':' || new.team));
    select count(*) into current_starters from public.players
      where match_id = new.match_id and team = new.team and starter and id <> new.id;
    if current_starters >= 5 then raise exception 'team_already_has_five_starters'; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists players_guard_lineup on public.players;
create trigger players_guard_lineup before insert or update on public.players
for each row execute function public.guard_player_lineup();

create or replace function public.prevent_self_rating()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.voter_user_id <> auth.uid() then raise exception 'invalid_voter'; end if;
  if exists (select 1 from public.players p where p.id = new.target_player_id and p.owner_user_id = auth.uid()) then
    raise exception 'self_rating_not_allowed';
  end if;
  if not exists (select 1 from public.players p where p.id = new.target_player_id and p.match_id = new.match_id) then
    raise exception 'player_match_mismatch';
  end if;
  return new;
end;
$$;
drop trigger if exists ratings_prevent_self on public.ratings;
create trigger ratings_prevent_self before insert or update on public.ratings
for each row execute function public.prevent_self_rating();

create or replace function public.refresh_rating_summary(p_player_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
  v_match_id uuid;
  v_trait text;
begin
  select count(*), max(match_id) into v_count, v_match_id from public.ratings where target_player_id = p_player_id;
  if v_count = 0 then delete from public.player_rating_summaries where target_player_id = p_player_id; return; end if;
  select trait into v_trait from public.ratings where target_player_id = p_player_id and trait is not null
    group by trait order by count(*) desc, trait asc limit 1;
  insert into public.player_rating_summaries (
    target_player_id, match_id, vote_count, technique, finishing, passing, defense, stamina,
    goalkeeping, magic, grit, hype, chaos, top_trait, updated_at
  )
  select p_player_id, v_match_id, v_count,
    case when v_count >= 3 then avg(technique) end,
    case when v_count >= 3 then avg(finishing) end,
    case when v_count >= 3 then avg(passing) end,
    case when v_count >= 3 then avg(defense) end,
    case when v_count >= 3 then avg(stamina) end,
    case when v_count >= 3 then avg(goalkeeping) end,
    case when v_count >= 3 then avg(magic) end,
    case when v_count >= 3 then avg(grit) end,
    case when v_count >= 3 then avg(hype) end,
    case when v_count >= 3 then avg(chaos) end,
    case when v_count >= 3 then v_trait end,
    now()
  from public.ratings where target_player_id = p_player_id
  on conflict (target_player_id) do update set
    match_id = excluded.match_id, vote_count = excluded.vote_count,
    technique = excluded.technique, finishing = excluded.finishing, passing = excluded.passing,
    defense = excluded.defense, stamina = excluded.stamina, goalkeeping = excluded.goalkeeping,
    magic = excluded.magic, grit = excluded.grit, hype = excluded.hype, chaos = excluded.chaos,
    top_trait = excluded.top_trait, updated_at = now();
end;
$$;

create or replace function public.sync_rating_summary()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_rating_summary(coalesce(new.target_player_id, old.target_player_id));
  return coalesce(new, old);
end;
$$;
drop trigger if exists ratings_sync_summary on public.ratings;
create trigger ratings_sync_summary after insert or update or delete on public.ratings
for each row execute function public.sync_rating_summary();

-- Operaciones colaborativas de alineación: no conceden edición de nombre/equipo.
create or replace function public.set_player_starter(p_player_id uuid, p_starter boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  update public.players set starter = p_starter, goalkeeper = case when p_starter then goalkeeper else false end where id = p_player_id;
  if not found then raise exception 'player_not_found'; end if;
end;
$$;

create or replace function public.set_match_goalkeeper(p_player_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_match uuid; v_team text; v_starter boolean;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select match_id, team, starter into v_match, v_team, v_starter from public.players where id = p_player_id;
  if v_match is null then raise exception 'player_not_found'; end if;
  if not v_starter then raise exception 'goalkeeper_must_be_starter'; end if;
  if v_team = 'undecided' then raise exception 'team_required'; end if;
  update public.players set goalkeeper = false where match_id = v_match and team = v_team and goalkeeper;
  update public.players set goalkeeper = true where id = p_player_id;
end;
$$;

-- Las funciones internas solo se ejecutan mediante triggers. Las dos RPC de alineación
-- quedan disponibles exclusivamente para sesiones autenticadas (incluye anónimos).
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.guard_player_lineup() from public, anon, authenticated;
revoke all on function public.prevent_self_rating() from public, anon, authenticated;
revoke all on function public.refresh_rating_summary(uuid) from public, anon, authenticated;
revoke all on function public.sync_rating_summary() from public, anon, authenticated;
revoke all on function public.set_player_starter(uuid, boolean) from public, anon, authenticated;
revoke all on function public.set_match_goalkeeper(uuid) from public, anon, authenticated;
grant execute on function public.set_player_starter(uuid, boolean) to authenticated;
grant execute on function public.set_match_goalkeeper(uuid) to authenticated;

alter table public.matches enable row level security;
alter table public.players enable row level security;
alter table public.ratings enable row level security;
alter table public.player_rating_summaries enable row level security;
alter table public.team_setups enable row level security;
alter table public.match_results enable row level security;

drop policy if exists "participants read matches" on public.matches;
create policy "participants read matches" on public.matches for select to authenticated using (true);

drop policy if exists "participants read players" on public.players;
create policy "participants read players" on public.players for select to authenticated using (true);
drop policy if exists "users create own player" on public.players;
create policy "users create own player" on public.players for insert to authenticated with check (owner_user_id = auth.uid());
drop policy if exists "owners update own player" on public.players;
create policy "owners update own player" on public.players for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
drop policy if exists "owners delete own player" on public.players;
create policy "owners delete own player" on public.players for delete to authenticated using (owner_user_id = auth.uid());

drop policy if exists "voters read own ratings" on public.ratings;
create policy "voters read own ratings" on public.ratings for select to authenticated using (voter_user_id = auth.uid());
drop policy if exists "voters create own ratings" on public.ratings;
create policy "voters create own ratings" on public.ratings for insert to authenticated with check (voter_user_id = auth.uid());
drop policy if exists "voters update own ratings" on public.ratings;
create policy "voters update own ratings" on public.ratings for update to authenticated using (voter_user_id = auth.uid()) with check (voter_user_id = auth.uid());
drop policy if exists "voters delete own ratings" on public.ratings;
create policy "voters delete own ratings" on public.ratings for delete to authenticated using (voter_user_id = auth.uid());

drop policy if exists "participants read rating summaries" on public.player_rating_summaries;
create policy "participants read rating summaries" on public.player_rating_summaries for select to authenticated using (true);

drop policy if exists "participants read team setups" on public.team_setups;
create policy "participants read team setups" on public.team_setups for select to authenticated using (true);
drop policy if exists "participants create team setups" on public.team_setups;
create policy "participants create team setups" on public.team_setups for insert to authenticated with check (updated_by = auth.uid());
drop policy if exists "participants update team setups" on public.team_setups;
create policy "participants update team setups" on public.team_setups for update to authenticated using (true) with check (updated_by = auth.uid());

drop policy if exists "participants read results" on public.match_results;
create policy "participants read results" on public.match_results for select to authenticated using (true);
drop policy if exists "participants create results" on public.match_results;
create policy "participants create results" on public.match_results for insert to authenticated with check (created_by = auth.uid());

grant select on public.matches, public.players, public.player_rating_summaries, public.team_setups, public.match_results to authenticated;
grant insert, update, delete on public.players, public.ratings to authenticated;
grant select on public.ratings to authenticated;
grant insert, update on public.team_setups to authenticated;
grant insert on public.match_results to authenticated;

insert into public.matches (slug, title, home_team, away_team, match_date, venue)
values ('superclasico-f5', 'SUPERCLÁSICO F5', 'Cerro Porteño', 'Olimpia', null, 'La canchita')
on conflict (slug) do nothing;

insert into public.team_setups (match_id, team, formation)
select id, 'cerro', '1-2-1' from public.matches where slug = 'superclasico-f5'
on conflict (match_id, team) do nothing;
insert into public.team_setups (match_id, team, formation)
select id, 'olimpia', '2-1-1' from public.matches where slug = 'superclasico-f5'
on conflict (match_id, team) do nothing;

-- Realtime: tablas sin papeletas privadas. ratings no se publica; se publica su resumen seguro.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'players') then alter publication supabase_realtime add table public.players; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'player_rating_summaries') then alter publication supabase_realtime add table public.player_rating_summaries; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_setups') then alter publication supabase_realtime add table public.team_setups; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'match_results') then alter publication supabase_realtime add table public.match_results; end if;
end $$;

alter table public.players replica identity full;
alter table public.player_rating_summaries replica identity full;
alter table public.team_setups replica identity full;
alter table public.match_results replica identity full;
