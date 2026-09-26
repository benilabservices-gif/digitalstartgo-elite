-- Migration 0011 : coach_list_participants() — SECURITY DEFINER
-- ============================================================

-- 1. Fonction pour lister les participants d'un coach ou admin
--    SECURITY DEFINER pour contourner RLS sur profiles
--    Retourne pour chaque participant :
--    - id, business_name, cohort_name
--    - current_stage_number, current_stage_title (première étape avec mission non validée)
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
begin
  -- Vérifier que l'appelant est coach ou admin via les fonctions existantes
  if not public.is_admin() and not public.is_coach() then
    raise exception 'Unauthorized: only coaches and admins can list participants';
  end if;

  -- Requête unique : admin voit tous les participants, coach voit les siens
  return query
  select
    p.id,
    p.business_name,
    c.name,
    (
      select s.number
      from stages s
      join missions m on m.stage_id = s.id
      left join mission_progress mp on mp.mission_id = m.id and mp.profile_id = p.id
      where mp.id is null or mp.status != 'valide'
      order by s.number asc
      limit 1
    ) as current_stage_number,
    (
      select s.title
      from stages s
      join missions m on m.stage_id = s.id
      left join mission_progress mp on mp.mission_id = m.id and mp.profile_id = p.id
      where mp.id is null or mp.status != 'valide'
      order by s.number asc
      limit 1
    ) as current_stage_title,
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
  where p.role = 'participant'
    and (
      public.is_admin()
      or p.cohort_id in (
        select cc.cohort_id from cohort_coaches cc where cc.coach_id = auth.uid()
      )
    );
end;
$$;

-- 2. Révoquer l'accès public
revoke execute on function public.coach_list_participants() from public, anon;
grant execute on function public.coach_list_participants() to authenticated;

-- 3. Test de vérification (exécuté dans une transaction annulée)
--    À lancer après fusion pour valider le comportement :
--
--    -- Test 1 : un coach voit ses participants
--    begin;
--      select * from public.coach_list_participants();
--    rollback;
--
--    -- Test 2 : un admin voit tous les participants
--    begin;
--      set local role admin;
--      select * from public.coach_list_participants();
--    rollback;
--
--    -- Test 3 : un participant reçoit une erreur
--    begin;
--      select * from public.coach_list_participants();
--    rollback;
--    -- Attendu : ERROR: Unauthorized: only coaches and admins can list participants
