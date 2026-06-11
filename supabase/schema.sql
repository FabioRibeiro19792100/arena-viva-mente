create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  username text not null unique,
  favorite_team text default 'Neutro',
  provider text not null check (provider in ('google', 'github', 'x')),
  plan text not null default 'free' check (plan in ('free', 'premium')),
  avatar_url text,
  join_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

create table if not exists public.reservations (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null,
  access_type text not null default 'digital' check (access_type in ('digital')),
  reserved_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

create table if not exists public.history_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null,
  context text not null check (context in ('booking', 'arquibancada', 'resumo')),
  visited_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id, context)
);

create table if not exists public.match_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null,
  team_side text not null check (team_side in ('home', 'away', 'neutral')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  user_avatar_url text,
  text text not null check (char_length(text) <= 180),
  team_side text not null check (team_side in ('home', 'away', 'neutral')),
  likes_count integer not null default 0,
  dislikes_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists messages_match_id_created_at_idx
  on public.messages (match_id, created_at);

create table if not exists public.api_feed_cache (
  cache_key text primary key,
  payload jsonb not null,
  source text not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.sports_matches (
  id text primary key,
  provider text not null check (provider in ('internal', 'football', 'nba', 'volleyball')),
  provider_match_id text,
  sport text not null check (sport in ('futebol', 'basquete', 'volei')),
  league_name text not null,
  country_name text,
  stage text not null,
  home_team text not null,
  away_team text not null,
  home_logo text,
  away_logo text,
  starts_at timestamptz not null,
  timezone text not null default 'America/Sao_Paulo',
  status text not null check (status in ('scheduled', 'live', 'ended')),
  status_detail text,
  home_score integer,
  away_score integer,
  live_clock text,
  venue text,
  city text,
  has_room boolean not null default false,
  league_external_id integer,
  season integer,
  home_team_external_id integer,
  away_team_external_id integer,
  raw_payload jsonb,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_match_id)
);

create index if not exists sports_matches_sport_starts_at_idx
  on public.sports_matches (sport, starts_at);

create index if not exists sports_matches_status_starts_at_idx
  on public.sports_matches (status, starts_at);

create table if not exists public.sports_sync_status (
  sport text primary key check (sport in ('futebol', 'basquete', 'volei')),
  mode text not null check (mode in ('scheduled', 'live', 'manual')),
  status text not null check (status in ('ok', 'partial', 'offline', 'plan', 'limit', 'suspended')),
  message text,
  last_synced_at timestamptz not null default now()
);

create table if not exists public.match_insights_cache (
  match_id text primary key references public.sports_matches(id) on delete cascade,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.world_cup_predictions (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null,
  predicted_home_score integer not null check (predicted_home_score >= 0),
  predicted_away_score integer not null check (predicted_away_score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

create index if not exists world_cup_predictions_match_id_idx
  on public.world_cup_predictions (match_id);

create table if not exists public.world_cup_matches (
  id text primary key,
  stage text not null,
  group_name text,
  match_number integer not null,
  home_team text not null,
  away_team text not null,
  home_flag text,
  away_flag text,
  kickoff_at timestamptz not null,
  timezone text not null default 'America/Sao_Paulo',
  venue text,
  city text,
  status text not null check (status in ('scheduled', 'live', 'ended')),
  status_detail text,
  home_score integer,
  away_score integer,
  live_clock text,
  linked_sports_match_id text,
  source text not null default 'seed',
  source_url text,
  source_payload jsonb,
  last_score_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists world_cup_matches_kickoff_at_idx
  on public.world_cup_matches (kickoff_at);

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.reservations enable row level security;
alter table public.history_entries enable row level security;
alter table public.match_preferences enable row level security;
alter table public.messages enable row level security;
alter table public.world_cup_predictions enable row level security;
alter table public.world_cup_matches enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "favorites_all_own" on public.favorites;
drop policy if exists "reservations_all_own" on public.reservations;
drop policy if exists "history_entries_all_own" on public.history_entries;
drop policy if exists "match_preferences_all_own" on public.match_preferences;
drop policy if exists "messages_select_authenticated" on public.messages;
drop policy if exists "messages_insert_own" on public.messages;
drop policy if exists "world_cup_predictions_select_authenticated" on public.world_cup_predictions;
drop policy if exists "world_cup_predictions_all_own" on public.world_cup_predictions;
drop policy if exists "world_cup_matches_select_authenticated" on public.world_cup_matches;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "favorites_all_own" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reservations_all_own" on public.reservations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "history_entries_all_own" on public.history_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "match_preferences_all_own" on public.match_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "messages_select_authenticated" on public.messages
  for select using (auth.role() = 'authenticated');

create policy "messages_insert_own" on public.messages
  for insert with check (auth.uid() = user_id);

create policy "world_cup_predictions_select_authenticated" on public.world_cup_predictions
  for select using (auth.role() = 'authenticated');

create policy "world_cup_predictions_all_own" on public.world_cup_predictions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "world_cup_matches_select_authenticated" on public.world_cup_matches
  for select using (auth.role() = 'authenticated');
