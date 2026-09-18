-- Un admin doit voir tous les abonnements pour savoir qui a déjà un accès
-- avant d'en accorder un manuellement (évite les doublons involontaires).
create policy "subscriptions_select_admin" on subscriptions
  for select to authenticated using (public.is_admin());
