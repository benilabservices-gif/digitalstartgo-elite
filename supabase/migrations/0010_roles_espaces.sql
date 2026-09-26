-- Migration 0010 : Espaces par rôle et fonctions admin
-- ============================================================

-- 1. Fonction pour vérifier si l'utilisateur est admin
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

-- 2. Fonction pour changer le rôle d'un utilisateur
--    SECURITY DEFINER pour contourner RLS
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
  
  -- Refuser tout rôle autre que participant, coach ou admin
  if p_new_role not in ('participant', 'coach', 'admin') then
    raise exception 'Invalid role: must be participant, coach, or admin';
  end if;
  
  -- Mettre à jour le rôle
  update profiles
  set role = p_new_role,
      updated_at = now()
  where id = p_user_id;
end;
$$;

-- 3. Fonction pour lister tous les membres (admin uniquement)
--    SECURITY DEFINER pour permettre la lecture de auth.users
create or replace function public.admin_list_members()
returns table (
  id uuid,
  email text,
  full_name text,
  business_name text,
  role text,
  cohort_id uuid,
  subscription_active boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Vérifier que l'appelant est admin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Unauthorized: only admins can list members';
  end if;
  
  -- Retourner la liste des membres avec leur email depuis auth.users
  return query
  select
    p.id,
    au.email::text,
    p.full_name,
    p.business_name,
    p.role,
    p.cohort_id,
    exists (
      select 1 from subscriptions s
      where s.profile_id = p.id
      and s.expires_at > now()
    ) as subscription_active
  from profiles p
  left join auth.users au on au.id = p.id;
end;
$$;

-- 4. Mettre à jour prevent_role_self_update pour autoriser les admins
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

  -- Autoriser les admins à modifier les rôles via change_user_role
  if public.is_admin() then
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

-- 5. Mettre à jour coach_participant_names pour accepter les admins
create or replace function public.coach_participant_names(p_profile_ids uuid[])
returns table (id uuid, business_name text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.business_name
  from public.profiles p
  where (public.is_coach() or public.is_admin())
    and p.id = any(p_profile_ids);
$$;

-- 6. Révoquer l'accès public aux fonctions sensibles
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

revoke execute on function public.change_user_role(uuid, text) from public, anon;
grant execute on function public.change_user_role(uuid, text) to authenticated;

revoke execute on function public.admin_list_members() from public, anon;
grant execute on function public.admin_list_members() to authenticated;

-- 7. Politiques RLS pour mission_submissions — permitir aux admins de tout voir
drop policy if exists "admins_manage_submissions" on mission_submissions;
create policy "admins_manage_submissions" on mission_submissions
  for all to authenticated using (public.is_admin());

-- 8. Politiques RLS pour mission_progress — permettent aux admins de tout voir
drop policy if exists "admins_manage_progress" on mission_progress;
create policy "admins_manage_progress" on mission_progress
  for all to authenticated using (public.is_admin());
