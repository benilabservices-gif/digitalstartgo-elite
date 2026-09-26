-- Migration 0013 : coach_list_participants() avec la règle des missions guidées
-- Une étape est validée pour un participant si :
--   toutes ses missions actives sont validées (ou elle n'en a aucune)
--   OU une de ses missions inactives (ancienne mission) est validée.
-- L'étape actuelle = la première étape (ordre stages.number) non validée ; null si tout est validé.
-- ============================================================

create or replace function public.coach_list_participants()
returns table (
  id uuid,
  business_name text,
  cohort_name text,
  current_stage_number integer,
  current_stage_title text,
  last_submission_status text,
  last_submission_date timestamp with time zone
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_is_admin boolean := public.is_admin();
begin
  if not v_is_admin and not public.is_coach() then
    raise exception 'Unauthorized: only coaches and admins can list participants';
  end if;

  return query
  with participants as (
    select p.id as pid, p.business_name as nom, p.cohort_id as cid
    from profiles p
    where p.role = 'participant'
      and (
        v_is_admin
        or p.cohort_id in (select cc.cohort_id from cohort_coaches cc where cc.coach_id = auth.uid())
      )
  ),
  etat_etapes as (
    select
      pa.pid,
      s.number as num,
      s.title as titre,
      count(m.id) filter (
        where m.active is not false and coalesce(mp.status, '') <> 'valide'
      ) as actives_restantes,
      coalesce(bool_or(m.active = false and mp.status = 'valide'), false) as ancienne_validee
    from participants pa
    cross join stages s
    left join missions m on m.stage_id = s.id
    left join mission_progress mp on mp.mission_id = m.id and mp.profile_id = pa.pid
    group by pa.pid, s.number, s.title
  ),
  etape_actuelle as (
    select distinct on (e.pid) e.pid, e.num, e.titre
    from etat_etapes e
    where not (e.actives_restantes = 0 or e.ancienne_validee)
    order by e.pid, e.num asc
  ),
  dernier_livrable as (
    select distinct on (mp.profile_id) mp.profile_id, ms.statut, ms.created_at
    from mission_submissions ms
    join mission_progress mp on mp.id = ms.mission_progress_id
    where mp.profile_id in (select pa.pid from participants pa)
    order by mp.profile_id, ms.created_at desc
  )
  select
    pa.pid,
    pa.nom,
    c.name,
    ea.num,
    ea.titre,
    dl.statut,
    dl.created_at
  from participants pa
  left join cohorts c on c.id = pa.cid
  left join etape_actuelle ea on ea.pid = pa.pid
  left join dernier_livrable dl on dl.profile_id = pa.pid;
end;
$$;

revoke execute on function public.coach_list_participants() from public, anon;
grant execute on function public.coach_list_participants() to authenticated;
