-- Durcissement post-audit sécurité (advisor Supabase, 2026-09-17) : des
-- fonctions SECURITY DEFINER étaient appelables directement via RPC par
-- anon/authenticated alors qu'elles ne doivent jamais l'être (fonctions
-- trigger), ou seulement par authenticated (is_coach, coach_participant_names).
-- Un simple REVOKE ... FROM public ne suffit pas : Supabase accorde EXECUTE
-- à anon/authenticated indépendamment du pseudo-rôle public à la création
-- de la fonction — il faut le révoquer explicitement par rôle.

revoke execute on function public.assert_mission_not_validated() from public, anon, authenticated;
revoke execute on function public.sync_mission_progress_from_submission() from public, anon, authenticated;

revoke execute on function public.is_coach() from public, anon;
grant execute on function public.is_coach() to authenticated;

revoke execute on function public.coach_participant_names(uuid[]) from public, anon;
grant execute on function public.coach_participant_names(uuid[]) to authenticated;
