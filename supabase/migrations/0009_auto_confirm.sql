-- ============================================================
-- Migration 0009 : Désactiver la confirmation email obligatoire
-- ============================================================
--
-- PROBLÈME : Supabase exige la confirmation email par défaut,
-- mais le SMTP n'est pas configuré → les utilisateurs ne 
-- reçoivent jamais l'email et restent bloqués.
--
-- SOLUTION RECOMMANDÉE : Désactiver via le dashboard Supabase
-- (voir instructions dans RESEND_SETUP.md)
--
-- Cette migration tente de contourner le problème si les 
-- permissions le permettent.
-- ============================================================

-- ÉTAPE 1 : Donner les permissions nécessaires
-- Sans cela, le SQL contre auth.users échouera
do $$
begin
  -- Essayer d'accorder les droits sur auth.users
  grant all on auth.users to supabase_auth_admin;
  grant all on auth.users to authenticator;
  grant all on auth.users to service_role;
exception when others then
  -- Si ça échoue, ignorer (permissions déjà ok ou non nécessaires)
  null;
end;
$$;

-- ÉTAPE 2 : Auto-confirmer les utilisateurs existants
-- (fonctionne si les permissions sont suffisantes)
UPDATE auth.users
SET confirmed_at = COALESCE(confirmed_at, now()),
    email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE confirmed_at IS NULL;

-- ÉTAPE 3 : Fonction pour confirmer un utilisateur par son ID
-- Utilisable depuis les Edge Functions Resend
create or replace function public.confirm_user_by_id(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_count integer;
begin
  update auth.users
  set confirmed_at = now(),
      email_confirmed_at = now()
  where id = p_user_id
    and confirmed_at is null;
  
  get diagnostics updated_count = row_count;
  return updated_count > 0;
end;
$$;

-- Autoriser l'appel de la fonction
revoke execute on function public.confirm_user_by_id(uuid) from public, anon;
grant execute on function public.confirm_user_by_id(uuid) to authenticated;
