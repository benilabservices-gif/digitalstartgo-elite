-- Migration 0010 : Espaces par rôle et fonctions admin
-- ============================================================

-- 1. Fonction pour changer le rôle d'un utilisateur
--    Sécurité : SECURITY DEFINER pour contourner RLS
--    Vérifie que l'appelant est admin et qu'il ne se retire pas lui-même son rôle
create or replace function public.change_user_role(
  p_user_id uuid,
  p_new_role text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_id uuid;
  caller_role text;
begin
  -- Récupérer l'ID de l'utilisateur qui appelle la fonction
  caller_id := auth.uid();
  
  -- Vérifier que l'appelant est admin
  select role into caller_role
  from profiles
  where id = caller_id;
  
  if caller_role is distinct from 'admin' then
    raise exception 'Unauthorized: only admins can change roles';
  end if;
  
  -- Empêcher un admin de se retirer son propre rôle
  if caller_id = p_user_id and p_new_role != 'admin' then
    raise exception 'Cannot remove your own admin role';
  end if;
  
  -- Mettre à jour le rôle
  update profiles
  set role = p_new_role,
      updated_at = now()
  where id = p_user_id;
end;
$$;

-- 2. Autoriser uniquement authenticated à appeler cette fonction
revoke execute on function public.change_user_role(uuid, text) from public, anon;
grant execute on function public.change_user_role(uuid, text) to authenticated;

-- 3. Fonction helper pour vérifier si l'utilisateur est admin
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$;

-- 4. Autoriser l'appel de is_admin()
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 5. Modifier les policies RLS pour mission_submissions
--    Permettre aux admins de tout voir et modifier
drop policy if exists "admins_manage_submissions" on mission_submissions;
create policy "admins_manage_submissions" on mission_submissions
  for all using (public.is_admin());

-- 6. Modifier les policies RLS pour mission_progress
--    Permettre aux admins de tout voir et modifier
drop policy if exists "admins_manage_progress" on mission_progress;
create policy "admins_manage_progress" on mission_progress
  for all using (public.is_admin());

-- 7. Créer une vue pour lister tous les membres avec leurs infos complètes
create or replace view public.v_all_members as
select
  p.id,
  p.email,
  p.full_name,
  p.business_name,
  p.role,
  p.cohort_id,
  c.name as cohort_name,
  p.onboarding_completed,
  s.id as subscription_id,
  s.plan,
  s.expires_at,
  case when s.id is not null and s.expires_at > now() then true else false end as subscription_active
from profiles p
left join cohorts c on p.cohort_id = c.id
left join subscriptions s on p.id = s.profile_id and s.expires_at > now();
