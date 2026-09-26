-- Migration 0011 : Fonctions admin et coach pour contourner RLS
-- ============================================================

-- 1. Fonction pour lister les participants d'un coach (SECURITY DEFINER)
--    Retourne pour chaque participant :
--    - id, business_name, cohort_name
--    - current_stage (numéro + titre de la première étape non validée)
--    - last_submission_status, last_submission_date
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
  caller_id uuid;
  caller_is_admin boolean;
  caller_is_coach boolean;
  _cohort_ids uuid[];
begin
  caller_id := auth.uid();

  -- Vérifier que l'appelant est coach ou admin
  select
    exists (select 1 from profiles where id = caller_id and role = 'admin'),
    exists (select 1 from profiles where id = caller_id and role = 'coach')
  into caller_is_admin, caller_is_coach;

  if not caller_is_admin and not caller_is_coach then
    raise exception 'Unauthorized: only coaches and admins can list participants';
  end if;

  -- Si admin, retourner tous les participants de toutes les cohortes
  if caller_is_admin then
    return query
    select
      p.id,
      p.business_name,
      c.name,
      (select m.number from missions m
       join mission_progress mp on mp.mission_id = m.id
       where mp.profile_id = p.id
         and mp.status != 'valide'
       order by m.number asc
       limit 1) as current_stage_number,
      (select m.title from missions m
       join mission_progress mp on mp.mission_id = m.id
       where mp.profile_id = p.id
         and mp.status != 'valide'
       order by m.number asc
       limit 1) as current_stage_title,
      (select ms.statut from mission_submissions ms
       join mission_progress mp on mp.id = ms.mission_progress_id
       where mp.profile_id = p.id
       order by ms.created_at desc
       limit 1) as last_submission_status,
      (select ms.created_at from mission_submissions ms
       join mission_progress mp on mp.id = ms.mission_progress_id
       where mp.profile_id = p.id
       order by ms.created_at desc
       limit 1) as last_submission_date
    from profiles p
    left join cohorts c on p.cohort_id = c.id
    where p.role = 'participant';

  -- Si coach, retourner uniquement les participants de ses cohortes
  else
    -- Récupérer les cohortes du coach
    select array_agg(cc.cohort_id)
    into _cohort_ids
    from cohort_coaches cc
    where cc.coach_id = caller_id;

    if _cohort_ids is null or array_length(_cohort_ids, 1) is null then
      return;
    end if;

    return query
    select
      p.id,
      p.business_name,
      c.name,
      (select m.number from missions m
       join mission_progress mp on mp.mission_id = m.id
       where mp.profile_id = p.id
         and mp.status != 'valide'
       order by m.number asc
       limit 1) as current_stage_number,
      (select m.title from missions m
       join mission_progress mp on mp.mission_id = m.id
       where mp.profile_id = p.id
         and mp.status != 'valide'
       order by m.number asc
       limit 1) as current_stage_title,
      (select ms.statut from mission_submissions ms
       join mission_progress mp on mp.id = ms.mission_progress_id
       where mp.profile_id = p.id
       order by ms.created_at desc
       limit 1) as last_submission_status,
      (select ms.created_at from mission_submissions ms
       join mission_progress mp on mp.id = ms.mission_progress_id
       where mp.profile_id = p.id
       order by ms.created_at desc
       limit 1) as last_submission_date
    from profiles p
    left join cohorts c on p.cohort_id = c.id
    where p.role = 'participant'
      and p.cohort_id = any(_cohort_ids);
  end if;
end;
$$;

-- 2. Révoquer l'accès public
revoke execute on function public.coach_list_participants() from public, anon;
grant execute on function public.coach_list_participants() to authenticated;
