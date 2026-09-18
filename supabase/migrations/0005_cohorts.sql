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
