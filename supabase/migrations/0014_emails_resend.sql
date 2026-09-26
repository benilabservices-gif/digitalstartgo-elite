-- Migration 0014 : Emails métier via Resend
-- ============================================================

-- 1. Colonne rappels_email sur profiles
alter table profiles
  add column if not exists rappels_email boolean not null default true;

-- 2. Table email_log — journal anti-doublon
create table email_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  type text not null,
  ref text not null,
  resend_id text,
  created_at timestamptz not null default now(),
  unique (type, ref)
);

alter table email_log enable row level security;

-- Seule la clé service_role (serveur) peut écrire : aucune policy pour authenticated.
