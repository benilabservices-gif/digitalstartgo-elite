create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  plan text not null check (plan in ('starter', 'pro', 'elite')),
  cartflox_order_id text not null unique,
  amount integer not null,
  currency text not null default 'XOF',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index subscriptions_profile_active_idx on subscriptions (profile_id, expires_at desc);

alter table subscriptions enable row level security;

create policy "subscriptions_select_own" on subscriptions
  for select to authenticated using (auth.uid() = profile_id);

-- Aucune policy insert/update/delete pour authenticated : seule la route
-- webhook (service_role, jamais exposée au client, déclenchée uniquement
-- après vérification de la signature Cartflox) peut créer un abonnement.
-- Un participant ne doit jamais pouvoir s'auto-attribuer un accès payant.
