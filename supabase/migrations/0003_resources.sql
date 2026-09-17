create table resources (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid references stages(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text not null,
  type text not null check (type in ('guide', 'lien')),
  content_blocks jsonb,
  external_url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  constraint resources_content_matches_type check (
    (type = 'guide' and content_blocks is not null and external_url is null) or
    (type = 'lien' and external_url is not null and content_blocks is null)
  )
);

alter table resources enable row level security;

create policy "resources_select_authenticated" on resources
  for select using (auth.role() = 'authenticated');
