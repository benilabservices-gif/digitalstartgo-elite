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

-- Missions : soumission de livrable par le participant, revue par un coach humain.
-- Cette migration ajoute le rôle utilisateur, la table d'historique des soumissions,
-- les policies RLS associées et les triggers qui gardent mission_progress cohérent.
--
-- Toutes les fonctions fixent `search_path = public, pg_temp` : sans mention
-- explicite de pg_temp, PostgreSQL le place implicitement en tête du chemin de
-- recherche, ce qui permet à un utilisateur de masquer une table ou une fonction
-- par un objet temporaire homonyme.

-- ---------------------------------------------------------------------------
-- 1. Rôle utilisateur
-- ---------------------------------------------------------------------------

-- Le rôle 'admin' est accepté par la contrainte mais volontairement inerte pour
-- ce MVP : is_coach() ne teste que 'coach', un admin n'a donc aucun accès à la
-- revue. La gestion des rôles fera l'objet d'un plan dédié.
alter table profiles
  add column role text not null default 'participant'
    check (role in ('participant', 'coach', 'admin'));

-- La ligne profiles est créée ET mise à jour par le client (upsert de
-- l'onboarding). Les policies de 0001 ne contrôlent que `auth.uid() = id`, sans
-- jamais regarder `role` : sans ce trigger, n'importe quel inscrit pourrait
-- poser role = 'coach' dès l'INSERT, ou se promouvoir plus tard par UPDATE.
-- auth.uid() est nul pour la clé service_role et dans l'éditeur SQL : la
-- promotion manuelle par un administrateur reste possible.
create or replace function public.prevent_role_self_update()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role is distinct from 'participant' then
      raise exception 'Le rôle ne peut pas être défini depuis l''application.';
    end if;
  elsif new.role is distinct from old.role then
    raise exception 'Le rôle ne peut pas être modifié depuis l''application.';
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_role_self_update
  before insert or update on profiles
  for each row execute function public.prevent_role_self_update();

-- Test d'appartenance au rôle coach. SECURITY DEFINER est indispensable : la
-- fonction est appelée depuis les policies de mission_progress et
-- mission_submissions, un accès soumis à RLS provoquerait une récursion.
create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'coach'
  );
$$;

-- L'interface coach n'a besoin que du nom commercial du participant. Plutôt
-- qu'une policy select sur profiles — qui exposerait prix, objectif mensuel,
-- taille d'audience et offre de tous les participants — le coach passe par
-- cette fonction, qui ne renvoie que les deux colonnes nécessaires.
create or replace function public.coach_participant_names(p_profile_ids uuid[])
returns table (id uuid, business_name text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.business_name
  from public.profiles p
  where public.is_coach()
    and p.id = any(p_profile_ids);
$$;

revoke execute on function public.coach_participant_names(uuid[]) from public;
grant execute on function public.coach_participant_names(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Soumissions
-- ---------------------------------------------------------------------------

create table mission_submissions (
  id uuid primary key default gen_random_uuid(),
  mission_progress_id uuid not null references mission_progress(id) on delete cascade,
  -- Borne serveur : la limite côté client ne protège pas d'un appel direct.
  contenu text not null check (length(btrim(contenu)) between 1 and 4000),
  statut text not null default 'soumis'
    check (statut in ('soumis', 'a_corriger', 'valide')),
  feedback_coach text,
  corrige_par uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mission_submissions_progress_idx
  on mission_submissions (mission_progress_id, created_at desc);
create index mission_submissions_queue_idx
  on mission_submissions (statut, created_at);

-- Une seule soumission en attente par mission : empêche un participant de noyer
-- la file de revue en insérant des soumissions en boucle.
create unique index mission_submissions_one_pending_idx
  on mission_submissions (mission_progress_id)
  where statut = 'soumis';

alter table mission_submissions enable row level security;

-- Un participant lit uniquement les soumissions rattachées à sa propre progression.
create policy "mission_submissions_select_own" on mission_submissions
  for select to authenticated using (
    exists (
      select 1 from mission_progress mp
      where mp.id = mission_submissions.mission_progress_id
        and mp.profile_id = auth.uid()
    )
  );

-- Un participant crée une soumission sur sa propre progression, et uniquement
-- avec le statut initial 'soumis'. Il ne peut ni s'auto-valider, ni écrire un
-- feedback, ni s'attribuer la correction.
create policy "mission_submissions_insert_own" on mission_submissions
  for insert to authenticated with check (
    statut = 'soumis'
    and feedback_coach is null
    and corrige_par is null
    and exists (
      select 1 from mission_progress mp
      where mp.id = mission_submissions.mission_progress_id
        and mp.profile_id = auth.uid()
    )
  );

-- Aucune policy UPDATE ni DELETE pour le participant : une soumission est
-- immuable de son côté, l'historique des tentatives est donc conservé.

-- Un coach voit toutes les soumissions (pas de cohortes pour ce MVP).
create policy "mission_submissions_select_coach" on mission_submissions
  for select to authenticated using (public.is_coach());

-- Un coach traite une soumission : uniquement vers 'valide' ou 'a_corriger',
-- et en signant la correction de son propre identifiant. Ce que le WITH CHECK
-- ne peut pas exprimer (comparaison avec l'ancienne ligne) est porté par le
-- trigger guard_submission_update ci-dessous.
create policy "mission_submissions_update_coach" on mission_submissions
  for update to authenticated using (public.is_coach())
  with check (
    public.is_coach()
    and statut in ('valide', 'a_corriger')
    and corrige_par = auth.uid()
  );

-- Une policy RLS ne voit que NEW : impossible d'y exprimer « le livrable ne
-- change pas » ou « la soumission n'a pas déjà été traitée ». Sans ce trigger,
-- un coach pourrait, par un PATCH direct, réécrire le contenu soumis, le
-- rattacher à une autre progression, ou rouvrir une mission déjà validée et
-- désynchroniser mission_progress.
create or replace function public.guard_submission_update()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.contenu is distinct from old.contenu
     or new.mission_progress_id is distinct from old.mission_progress_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Le livrable soumis est immuable.';
  end if;

  if old.statut <> 'soumis' then
    raise exception 'Cette soumission a déjà été traitée.';
  end if;

  return new;
end;
$$;

create trigger mission_submissions_guard_update
  before update on mission_submissions
  for each row execute function public.guard_submission_update();

-- ---------------------------------------------------------------------------
-- 3. Verrouillage des écritures du participant sur mission_progress
-- ---------------------------------------------------------------------------

create policy "mission_progress_select_coach" on mission_progress
  for select to authenticated using (public.is_coach());

-- La policy "mission_progress_all_own" (0001) est un FOR ALL : elle laissait un
-- participant écrire n'importe quel statut sur sa propre ligne, y compris
-- 'valide', et supprimer sa progression (donc l'historique des soumissions par
-- cascade). Elle est remplacée par des droits d'écriture limités aux statuts
-- que le participant a le droit de produire lui-même. Les statuts 'soumis',
-- 'a_corriger' et 'valide' ne peuvent plus venir que du trigger de
-- synchronisation, en SECURITY DEFINER.
drop policy "mission_progress_all_own" on mission_progress;

create policy "mission_progress_insert_own" on mission_progress
  for insert to authenticated with check (
    auth.uid() = profile_id
    and status in ('a_faire', 'en_cours')
  );

create policy "mission_progress_update_own" on mission_progress
  for update to authenticated using (
    auth.uid() = profile_id
    and status in ('a_faire', 'en_cours')
  ) with check (
    auth.uid() = profile_id
    and status in ('a_faire', 'en_cours')
  );

-- Volontairement aucune policy DELETE : la progression et son historique ne
-- s'effacent pas depuis l'application.

-- ---------------------------------------------------------------------------
-- 4. Cohérence mission_progress <-> mission_submissions
-- ---------------------------------------------------------------------------

-- Une mission validée est définitive : on refuse une nouvelle soumission au
-- niveau de la base, pas seulement dans l'interface.
create or replace function public.assert_mission_not_validated()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  progress_status text;
begin
  select status into progress_status
  from public.mission_progress
  where id = new.mission_progress_id;

  if progress_status is null then
    raise exception 'Progression de mission introuvable.';
  end if;

  if progress_status = 'valide' then
    raise exception 'Cette mission est déjà validée, elle ne peut plus être soumise.';
  end if;

  return new;
end;
$$;

create trigger mission_submissions_block_validated
  before insert on mission_submissions
  for each row execute function public.assert_mission_not_validated();

-- Le statut de mission_progress est dérivé de la dernière soumission. Le faire
-- en trigger SECURITY DEFINER évite d'ouvrir mission_progress en écriture aux
-- coachs et garantit que les deux tables ne peuvent jamais diverger, même si un
-- client appelle l'API PostgREST directement.
create or replace function public.sync_mission_progress_from_submission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.mission_progress
  set status = new.statut,
      updated_at = now()
  where id = new.mission_progress_id;
  return new;
end;
$$;

create trigger mission_submissions_sync_progress
  after insert or update of statut on mission_submissions
  for each row execute function public.sync_mission_progress_from_submission();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Nommé pour passer après mission_submissions_guard_update : à type et moment
-- égaux, PostgreSQL déclenche les triggers dans l'ordre alphabétique.
create trigger mission_submissions_touch_updated_at
  before update on mission_submissions
  for each row execute function public.touch_updated_at();

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

-- Durcissement post-audit sécurité (advisor Supabase, 2026-09-17) : des
-- fonctions SECURITY DEFINER étaient appelables directement via RPC par
-- anon/authenticated alors qu'elles ne doivent jamais l'être (fonctions
-- trigger), ou seulement par authenticated (is_coach, coach_participant_names).
-- Un simple REVOKE ... FROM public ne suffit pas : Supabase accorde EXECUTE
-- à anon/authenticated indépendamment du pseudo-rôle public à la création
-- de la fonction — il faut le révoquer explicitement par rôle.

revoke execute on function public.assert_mission_not_validated() from public, anon, authenticated;
revoke execute on function public.sync_mission_progress_from_submission() from public, anon, authenticated;

revoke execute on function public.is_coach() from public, anon;
grant execute on function public.is_coach() to authenticated;

revoke execute on function public.coach_participant_names(uuid[]) from public, anon;
grant execute on function public.coach_participant_names(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 1. Cohortes (table + fonction is_admin, RLS ajoutée après les tables liées)
-- ---------------------------------------------------------------------------

create table cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  starts_at date not null,
  ends_at date not null,
  created_at timestamptz not null default now()
);

alter table cohorts enable row level security;

-- Le rôle admin existait déjà (migration 0002) mais n'avait aucun usage réel :
-- c'est la première fonction qui lui donne un pouvoir effectif.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Assignation coach ↔ cohorte
-- ---------------------------------------------------------------------------

create table cohort_coaches (
  cohort_id uuid not null references cohorts(id) on delete cascade,
  coach_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cohort_id, coach_id)
);

alter table cohort_coaches enable row level security;

create policy "cohort_coaches_select_self_or_admin" on cohort_coaches
  for select to authenticated using (coach_id = auth.uid() or public.is_admin());

create policy "cohort_coaches_insert_admin" on cohort_coaches
  for insert to authenticated with check (public.is_admin());

create policy "cohort_coaches_delete_admin" on cohort_coaches
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Assignation participant ↔ cohorte
-- ---------------------------------------------------------------------------

alter table profiles add column cohort_id uuid references cohorts(id) on delete set null;

-- Comme pour `role` (migration 0002), la ligne profiles est créée ET mise à
-- jour par le client (upsert d'onboarding) : sans ce garde-fou, un participant
-- pourrait s'auto-assigner à n'importe quelle cohorte. La différence avec
-- `role` : un admin doit pouvoir modifier cette colonne depuis l'application,
-- donc le trigger laisse passer quand `is_admin()` est vrai plutôt que de tout
-- bloquer côté client.
create or replace function public.prevent_cohort_self_assignment()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.cohort_id is not null then
      raise exception 'La cohorte ne peut pas être définie depuis l''application.';
    end if;
  elsif new.cohort_id is distinct from old.cohort_id then
    raise exception 'La cohorte ne peut pas être modifiée depuis l''application.';
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_cohort_self_assignment
  before insert or update on profiles
  for each row execute function public.prevent_cohort_self_assignment();

-- Fonction étroite plutôt qu'une policy UPDATE large sur profiles : un admin
-- ne doit pouvoir toucher que cohort_id, jamais price/offre/objectif d'un
-- participant depuis cet écran.
create or replace function public.admin_assign_participant_cohort(p_profile_id uuid, p_cohort_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  update public.profiles
  set cohort_id = p_cohort_id
  where id = p_profile_id;
end;
$$;

revoke execute on function public.admin_assign_participant_cohort(uuid, uuid) from public, anon;
grant execute on function public.admin_assign_participant_cohort(uuid, uuid) to authenticated;

-- Même logique que coach_participant_names (migration 0002) : l'écran admin
-- n'a besoin que de l'identité et de l'assignation, jamais de price/offre/
-- objectif des participants.
create or replace function public.admin_list_profiles()
returns table (id uuid, business_name text, full_name text, role text, cohort_id uuid)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.business_name, p.full_name, p.role, p.cohort_id
  from public.profiles p
  where public.is_admin();
$$;

revoke execute on function public.admin_list_profiles() from public, anon;
grant execute on function public.admin_list_profiles() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS de cohorts (maintenant que profiles.cohort_id et cohort_coaches existent)
-- ---------------------------------------------------------------------------

create policy "cohorts_select_own_participant" on cohorts
  for select to authenticated using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.cohort_id = cohorts.id)
  );

create policy "cohorts_select_assigned_coach" on cohorts
  for select to authenticated using (
    exists (
      select 1 from cohort_coaches cc
      where cc.cohort_id = cohorts.id and cc.coach_id = auth.uid()
    )
  );

create policy "cohorts_select_admin" on cohorts
  for select to authenticated using (public.is_admin());

create policy "cohorts_insert_admin" on cohorts
  for insert to authenticated with check (public.is_admin());

create policy "cohorts_update_admin" on cohorts
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Filtrage coach par cohorte
-- ---------------------------------------------------------------------------

create or replace function public.coach_covers_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles participant
    join public.cohort_coaches cc on cc.cohort_id = participant.cohort_id
    where participant.id = p_profile_id
      and cc.coach_id = auth.uid()
  );
$$;

revoke execute on function public.coach_covers_profile(uuid) from public, anon;
grant execute on function public.coach_covers_profile(uuid) to authenticated;

-- Remplace l'accès global (« un coach voit toutes les soumissions ») par un
-- accès scopé à ses cohortes. Un participant sans cohorte devient invisible
-- pour tous les coachs jusqu'à assignation — c'est le comportement voulu.
drop policy "mission_submissions_select_coach" on mission_submissions;
create policy "mission_submissions_select_coach" on mission_submissions
  for select to authenticated using (
    public.is_coach()
    and exists (
      select 1 from mission_progress mp
      where mp.id = mission_submissions.mission_progress_id
        and public.coach_covers_profile(mp.profile_id)
    )
  );

drop policy "mission_submissions_update_coach" on mission_submissions;
create policy "mission_submissions_update_coach" on mission_submissions
  for update to authenticated using (
    public.is_coach()
    and exists (
      select 1 from mission_progress mp
      where mp.id = mission_submissions.mission_progress_id
        and public.coach_covers_profile(mp.profile_id)
    )
  )
  with check (
    public.is_coach()
    and statut in ('valide', 'a_corriger')
    and corrige_par = auth.uid()
  );

drop policy "mission_progress_select_coach" on mission_progress;
create policy "mission_progress_select_coach" on mission_progress
  for select to authenticated using (
    public.is_coach() and public.coach_covers_profile(mission_progress.profile_id)
  );

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

-- Permet à un admin d'accorder un abonnement manuellement, sans passer par
-- Cartflox — utile pour les comptes de test, les cas de support, ou un accès
-- offert. cartflox_order_id reste unique et non nul : on y met une valeur
-- synthétique pour les abonnements accordés manuellement.
create or replace function public.admin_grant_subscription(p_profile_id uuid, p_plan text, p_days integer default 30)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  if p_plan not in ('starter', 'pro', 'elite') then
    raise exception 'Palier invalide.';
  end if;

  insert into subscriptions (profile_id, plan, cartflox_order_id, amount, currency, expires_at)
  values (
    p_profile_id,
    p_plan,
    'admin-grant-' || gen_random_uuid()::text,
    0,
    'XOF',
    now() + (p_days || ' days')::interval
  );
end;
$$;

revoke execute on function public.admin_grant_subscription(uuid, text, integer) from public, anon;
grant execute on function public.admin_grant_subscription(uuid, text, integer) to authenticated;

-- Un admin doit voir tous les abonnements pour savoir qui a déjà un accès
-- avant d'en accorder un manuellement (évite les doublons involontaires).
create policy "subscriptions_select_admin" on subscriptions
  for select to authenticated using (public.is_admin());

