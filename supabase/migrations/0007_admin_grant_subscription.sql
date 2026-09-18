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
