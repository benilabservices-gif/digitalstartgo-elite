-- Migration 0013 : Mise à jour de coach_list_participants()
-- avec la règle de validation d'étape des missions guidées
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
  v_coach_id uuid := auth.uid();
begin
  -- Vérifier que l'appelant est coach ou admin via les fonctions existantes
  if not public.is_admin() and not public.is_coach() then
    raise exception 'Unauthorized: only coaches and admins can list participants';
  end if;

  -- Requête unique : admin voit tous les participants, coach voit les siens
  return query
  with participant_stages as (
    select
      p.id as profile_id,
      s.number as stage_number,
      s.title as stage_title,
      s.id as stage_id,
      -- Une étape est "validée" si toutes ses missions actives sont validées
      -- OU si une mission inactive de cette étape a été validée
      bool_and(
        case
          when m.active = false then mp.status = 'valide'
          else mp.status = 'valide'
        end
      ) as all_active_validated,
      bool_or(
        m.active = false and mp.status = 'valide'
      ) as has_inactive_validated
    from profiles p
    cross join stages s
    left join missions m on m.stage_id = s.id
    left join mission_progress mp on mp.mission_id = m.id and mp.profile_id = p.id
    where p.role = 'participant'
      and (
        public.is_admin()
        or p.cohort_id in (
          select cc.cohort_id from cohort_coaches cc where cc.coach_id = v_coach_id
        )
      )
    group by p.id, s.number, s.title, s.id
  ),
  validated_stages as (
    select
      profile_id,
      stage_number,
      stage_title,
      stage_id
    from participant_stages
    where (all_active_validated) or (has_inactive_validated)
  ),
  next_stage_per_participant as (
    select distinct on (ps.profile_id)
      ps.profile_id,
      ps.stage_number as current_stage_number,
      ps.stage_title as current_stage_title
    from participant_stages ps
    left join validated_stages vs
      on vs.profile_id = ps.profile_id
     and vs.stage_number < ps.stage_number
    where vs.profile_id is null  -- première étape non validée
    order by ps.profile_id, ps.stage_number asc
  )
  select
    p.id,
    p.business_name,
    c.name,
    nsp.current_stage_number,
    nsp.current_stage_title,
    (
      select ms.statut
      from mission_submissions ms
      join mission_progress mp on mp.id = ms.mission_progress_id
      where mp.profile_id = p.id
      order by ms.created_at desc
      limit 1
    ) as last_submission_status,
    (
      select ms.created_at
      from mission_submissions ms
      join mission_progress mp on mp.id = ms.mission_progress_id
      where mp.profile_id = p.id
      order by ms.created_at desc
      limit 1
    ) as last_submission_date
  from profiles p
  left join cohorts c on p.cohort_id = c.id
  left join next_stage_per_participant nsp on nsp.profile_id = p.id
  where p.role = 'participant'
    and (
      public.is_admin()
      or p.cohort_id in (
        select cc.cohort_id from cohort_coaches cc where cc.coach_id = v_coach_id
      )
    );
end;
$$;

-- Révoquer l'accès public (déjà fait dans 0011, mais on réapplique par sécurité)
revoke execute on function public.coach_list_participants() from public, anon;
grant execute on function public.coach_list_participants() to authenticated;
