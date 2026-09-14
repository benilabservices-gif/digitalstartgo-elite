create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  business_name text,
  activity text,
  target_audience text,
  main_offer text,
  price numeric,
  current_audience_size integer,
  main_channel text,
  monthly_goal_fcfa numeric,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create table diagnostics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  answers jsonb not null,
  score integer not null,
  priorities jsonb not null,
  created_at timestamptz not null default now()
);

alter table diagnostics enable row level security;

create policy "diagnostics_select_own" on diagnostics
  for select using (auth.uid() = profile_id);
create policy "diagnostics_insert_own" on diagnostics
  for insert with check (auth.uid() = profile_id);

create table stages (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique,
  slug text not null unique,
  title text not null,
  objective text not null,
  order_index integer not null
);

alter table stages enable row level security;

create policy "stages_select_authenticated" on stages
  for select using (auth.role() = 'authenticated');

create table missions (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references stages(id) on delete cascade,
  number integer not null unique,
  title text not null,
  objective text not null,
  estimated_duration_minutes integer not null,
  order_index integer not null
);

alter table missions enable row level security;

create policy "missions_select_authenticated" on missions
  for select using (auth.role() = 'authenticated');

create table mission_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  mission_id uuid not null references missions(id) on delete cascade,
  status text not null default 'a_faire'
    check (status in ('a_faire', 'en_cours', 'soumis', 'a_corriger', 'valide')),
  updated_at timestamptz not null default now(),
  unique (profile_id, mission_id)
);

alter table mission_progress enable row level security;

create policy "mission_progress_select_own" on mission_progress
  for select using (auth.uid() = profile_id);
create policy "mission_progress_all_own" on mission_progress
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
