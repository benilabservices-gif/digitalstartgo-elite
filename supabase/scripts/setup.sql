-- ============================================================================
-- SETUP VIRTUOSE FUNNEL — Copiez-collez ce fichier dans le SQL Editor de
-- Supabase Dashboard une seule fois.
-- ============================================================================

-- 1. Extensions
create extension if not exists "pgcrypto";

-- 2. Rôles et fonctions utilitaires
create or replace function public.is_coach()
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'coach');
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- 3. Table profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  business_name text,
  activity text,
  target_audience text,
  main_offer text,
  price numeric,
  current_audience_size integer,
  main_channel text,
  monthly_goal_fcfa numeric,
  onboarding_completed boolean not null default false,
  role text not null default 'participant' check (role in ('participant', 'coach', 'admin')),
  cohort_id uuid references public.cohorts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy if not exists "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy if not exists "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy if not exists "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- 4. Table diagnostics
create table if not exists public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null,
  score integer not null,
  priorities jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.diagnostics enable row level security;
create policy if not exists "diagnostics_select_own" on public.diagnostics for select using (auth.uid() = profile_id);
create policy if not exists "diagnostics_insert_own" on public.diagnostics for insert with check (auth.uid() = profile_id);

-- 5. Table stages
create table if not exists public.stages (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique,
  slug text not null unique,
  title text not null,
  objective text not null,
  order_index integer not null
);
alter table public.stages enable row level security;
create policy if not exists "stages_select_authenticated" on public.stages for select to authenticated using (auth.role() = 'authenticated');

-- 6. Table missions
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages(id) on delete cascade,
  number integer not null unique,
  title text not null,
  objective text not null,
  estimated_duration_minutes integer not null,
  order_index integer not null,
  code text,
  ordre integer default 1,
  active boolean default true,
  pourquoi text,
  exemple_avant text,
  exemple_apres text,
  champs jsonb,
  criteres jsonb,
  guide_outil jsonb,
  prompts_ia jsonb,
  bonus_elite text
);
alter table public.missions enable row level security;
create policy if not exists "missions_select_authenticated" on public.missions for select to authenticated using (auth.role() = 'authenticated');

-- 7. Table mission_progress
create table if not exists public.mission_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  status text not null default 'a_faire' check (status in ('a_faire', 'en_cours', 'soumis', 'a_corriger', 'valide')),
  updated_at timestamptz not null default now(),
  unique (profile_id, mission_id)
);
alter table public.mission_progress enable row level security;
create policy if not exists "mission_progress_select_own" on public.mission_progress for select using (auth.uid() = profile_id);
create policy if not exists "mission_progress_insert_own" on public.mission_progress for insert to authenticated with check (auth.uid() = profile_id and status in ('a_faire', 'en_cours'));
create policy if not exists "mission_progress_update_own" on public.mission_progress for update to authenticated using (auth.uid() = profile_id and status in ('a_faire', 'en_cours')) with check (auth.uid() = profile_id and status in ('a_faire', 'en_cours'));

-- 8. Table mission_submissions
create table if not exists public.mission_submissions (
  id uuid primary key default gen_random_uuid(),
  mission_progress_id uuid not null references public.mission_progress(id) on delete cascade,
  contenu text not null check (length(btrim(contenu)) between 1 and 4000),
  statut text not null default 'soumis' check (statut in ('soumis', 'a_corriger', 'valide')),
  feedback_coach text,
  corrige_par uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mission_submissions_progress_idx on public.mission_submissions (mission_progress_id, created_at desc);
create index if not exists mission_submissions_queue_idx on public.mission_submissions (statut, created_at);
create unique index if not exists mission_submissions_one_pending_idx on public.mission_submissions (mission_progress_id) where statut = 'soumis';
alter table public.mission_submissions enable row level security;
create policy if not exists "mission_submissions_select_own" on public.mission_submissions for select to authenticated using (exists (select 1 from public.mission_progress mp where mp.id = mission_submissions.mission_progress_id and mp.profile_id = auth.uid()));
create policy if not exists "mission_submissions_insert_own" on public.mission_submissions for insert to authenticated with check (statut = 'soumis' and feedback_coach is null and corrige_par is null and exists (select 1 from public.mission_progress mp where mp.id = mission_submissions.mission_progress_id and mp.profile_id = auth.uid()));
create policy if not exists "mission_submissions_select_coach" on public.mission_submissions for select to authenticated using (public.is_coach());
create policy if not exists "mission_submissions_update_coach" on public.mission_submissions for update to authenticated using (public.is_coach()) with check (public.is_coach() and statut in ('valide', 'a_corriger') and corrige_par = auth.uid());

-- 9. Triggers missions
create or replace function public.assert_mission_not_validated() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare progress_status text;
begin
  select status into progress_status from public.mission_progress where id = new.mission_progress_id;
  if progress_status is null then raise exception 'Progression de mission introuvable.'; end if;
  if progress_status = 'valide' then raise exception 'Cette mission est déjà validée.'; end if;
  return new;
end;
$$;
drop trigger if exists mission_submissions_block_validated on public.mission_submissions;
create trigger mission_submissions_block_validated before insert on public.mission_submissions for each row execute function public.assert_mission_not_validated();

create or replace function public.sync_mission_progress_from_submission() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.mission_progress set status = new.statut, updated_at = now() where id = new.mission_progress_id;
  return new;
end;
$$;
drop trigger if exists mission_submissions_sync_progress on public.mission_submissions;
create trigger mission_submissions_sync_progress after insert or update of statut on public.mission_submissions for each row execute function public.sync_mission_progress_from_submission();

create or replace function public.touch_updated_at() returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists mission_submissions_touch_updated_at on public.mission_submissions;
create trigger mission_submissions_touch_updated_at before update on public.mission_submissions for each row execute function public.touch_updated_at();

-- 10. Table resources
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid references public.stages(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text not null,
  type text not null check (type in ('guide', 'lien')),
  content_blocks jsonb,
  external_url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  constraint resources_content_matches_type check (
    (type = 'guide' and content_blocks is not null and external_url is null) or
    (type = 'lien' and external_url is not null and content_blocks is null)
  )
);
alter table public.resources enable row level security;
create policy if not exists "resources_select_authenticated" on public.resources for select to authenticated using (auth.role() = 'authenticated');

-- 11. Table notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_profile_idx on public.notifications (profile_id, read, created_at desc);
alter table public.notifications enable row level security;
create policy if not exists "notifications_select_own" on public.notifications for select to authenticated using (auth.uid() = profile_id);
create policy if not exists "notifications_insert_own" on public.notifications for insert to authenticated with check (auth.uid() = profile_id);

-- 12. Table cohorts
create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  starts_at date not null,
  ends_at date not null,
  created_at timestamptz not null default now()
);
alter table public.cohorts enable row level security;
create policy if not exists "cohorts_select_own_participant" on public.cohorts for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.cohort_id = cohorts.id));
create policy if not exists "cohorts_select_assigned_coach" on public.cohorts for select to authenticated using (exists (select 1 from public.cohort_coaches cc where cc.cohort_id = cohorts.id and cc.coach_id = auth.uid()));
create policy if not exists "cohorts_select_admin" on public.cohorts for select to authenticated using (public.is_admin());
create policy if not exists "cohorts_insert_admin" on public.cohorts for insert to authenticated with check (public.is_admin());
create policy if not exists "cohorts_update_admin" on public.cohorts for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 13. Table cohort_coaches
create table if not exists public.cohort_coaches (
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cohort_id, coach_id)
);
alter table public.cohort_coaches enable row level security;
create policy if not exists "cohort_coaches_select_self_or_admin" on public.cohort_coaches for select to authenticated using (coach_id = auth.uid() or public.is_admin());
create policy if not exists "cohort_coaches_insert_admin" on public.cohort_coaches for insert to authenticated with check (public.is_admin());
create policy if not exists "cohort_coaches_delete_admin" on public.cohort_coaches for delete to authenticated using (public.is_admin());

-- 14. Table subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('starter', 'pro', 'elite')),
  cartflox_order_id text not null unique,
  amount integer not null,
  currency text not null default 'XOF',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists subscriptions_profile_active_idx on public.subscriptions (profile_id, expires_at desc);
alter table public.subscriptions enable row level security;
create policy if not exists "subscriptions_select_own" on public.subscriptions for select to authenticated using (auth.uid() = profile_id);
create policy if not exists "subscriptions_select_admin" on public.subscriptions for select to authenticated using (public.is_admin());

-- 15. Fonctions admin
create or replace function public.admin_grant_subscription(p_profile_id uuid, p_plan text, p_days integer default 30) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'Réservé aux administrateurs.'; end if;
  if p_plan not in ('starter', 'pro', 'elite') then raise exception 'Palier invalide.'; end if;
  insert into public.subscriptions (profile_id, plan, cartflox_order_id, amount, currency, expires_at)
  values (p_profile_id, p_plan, 'admin-grant-' || gen_random_uuid()::text, 0, 'XOF', now() + (p_days || ' days')::interval);
end;
$$;
revoke execute on function public.admin_grant_subscription(uuid, text, integer) from public, anon;
grant execute on function public.admin_grant_subscription(uuid, text, integer) to authenticated;

create or replace function public.admin_list_profiles() returns table (id uuid, business_name text, full_name text, role text, cohort_id uuid) language sql stable security definer set search_path = public, pg_temp as $$
  select p.id, p.business_name, p.full_name, p.role, p.cohort_id from public.profiles p where public.is_admin();
$$;
revoke execute on function public.admin_list_profiles() from public, anon;
grant execute on function public.admin_list_profiles() to authenticated;

create or replace function public.coach_participant_names(p_profile_ids uuid[]) returns table (id uuid, business_name text) language sql stable security definer set search_path = public, pg_temp as $$
  select p.id, p.business_name from public.profiles p where public.is_coach() and p.id = any(p_profile_ids);
$$;
revoke execute on function public.coach_participant_names(uuid[]) from public, anon;
grant execute on function public.coach_participant_names(uuid[]) to authenticated;

create or replace function public.prevent_role_self_update() returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then
    if new.role is distinct from 'participant' then raise exception 'Le rôle ne peut pas être défini depuis l''application.'; end if;
  elsif new.role is distinct from old.role then
    raise exception 'Le rôle ne peut pas être modifié depuis l''application.';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_prevent_role_self_update on public.profiles;
create trigger profiles_prevent_role_self_update before insert or update on public.profiles for each row execute function public.prevent_role_self_update();

create or replace function public.prevent_cohort_self_assignment() returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    if new.cohort_id is not null then raise exception 'La cohorte ne peut pas être définie depuis l''application.'; end if;
  elsif new.cohort_id is distinct from old.cohort_id then
    raise exception 'La cohorte ne peut pas être modifiée depuis l''application.';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_prevent_cohort_self_assignment on public.profiles;
create trigger profiles_prevent_cohort_self_assignment before insert or update on public.profiles for each row execute function public.prevent_cohort_self_assignment();

create or replace function public.admin_assign_participant_cohort(p_profile_id uuid, p_cohort_id uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'Réservé aux administrateurs.'; end if;
  update public.profiles set cohort_id = p_cohort_id where id = p_profile_id;
end;
$$;
revoke execute on function public.admin_assign_participant_cohort(uuid, uuid) from public, anon;
grant execute on function public.admin_assign_participant_cohort(uuid, uuid) to authenticated;

create or replace function public.coach_covers_profile(p_profile_id uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.profiles participant
    join public.cohort_coaches cc on cc.cohort_id = participant.cohort_id
    where participant.id = p_profile_id and cc.coach_id = auth.uid()
  );
$$;
revoke execute on function public.coach_covers_profile(uuid) from public, anon;
grant execute on function public.coach_covers_profile(uuid) to authenticated;

-- ============================================================================
-- SEED: Stages + Missions
-- ============================================================================
insert into public.stages (number, slug, title, objective, order_index) values
  (1, 'diagnostic', 'Diagnostic', 'Évaluer l''état actuel de votre système de vente.', 1),
  (2, 'offre', 'Offre', 'Transformer votre expertise en une offre claire et désirable.', 2),
  (3, 'cible-positionnement', 'Cible & Positionnement', 'Définir précisément qui vous servez et pourquoi vous.', 3),
  (4, 'lead-magnet', 'Lead Magnet', 'Créer une ressource qui capture vos prospects.', 4),
  (5, 'acquisition', 'Acquisition', 'Mettre en place vos canaux de trafic.', 5),
  (6, 'funnel', 'Mon Funnel', 'Construire un funnel complet de la landing page au checkout.', 6),
  (7, 'conversion-relance', 'Conversion & Relance', 'Optimiser votre page de vente et vos séquences de relance.', 7),
  (8, 'mesure-optimisation', 'Mesure & Optimisation', 'Suivre vos métriques et améliorer en continu.', 8)
on conflict (number) do nothing;

insert into public.missions (stage_id, number, title, objective, estimated_duration_minutes, order_index)
select s.id, s.number, m.title, m.objective, m.duration, s.number
from public.stages s
join (values
  (1, 'Réaliser mon diagnostic funnel', 'Obtenir mon Funnel Score et mes 3 priorités.', 15),
  (2, 'Construire mon offre irrésistible', 'Transformer mon expertise en une offre claire, désirable et commercialisable.', 90),
  (3, 'Clarifier ma cible et mon positionnement', 'Définir précisément qui je sers et le message qui lui parle.', 60),
  (4, 'Créer mon lead magnet', 'Produire une ressource gratuite qui capture mes premiers prospects.', 120),
  (5, 'Lancer mon premier canal d''acquisition', 'Mettre en place une source de trafic régulière vers mon funnel.', 90),
  (6, 'Construire ma page de vente', 'Créer une page de vente capable de transformer mes prospects en clients.', 150),
  (7, 'Mettre en place ma relance', 'Créer une séquence de relance email ou WhatsApp pour les prospects non convertis.', 90),
  (8, 'Suivre mes métriques clés', 'Mettre en place le suivi de mes leads, ventes et revenu.', 60)
) as m(number, title, objective, duration) on m.number = s.number;

-- Passer les anciennes missions 1 et 2 à inactive
update public.missions set active = false, ordre = 0 where number in (1, 2);

-- Missions guidées étape 1
insert into public.missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
values
  ((select id from public.stages where number = 1), '1.1', 1, 1, 'Faire l''état des lieux de votre activité', 'Photographiez votre activité telle qu''elle est aujourd''hui : c''est le point de départ de tout le parcours.', 20, 1, true,
   'On ne construit pas un système de vente sur des impressions. Cette mission photographie votre activité telle qu''elle est aujourd''hui : c''est le point de départ de tout le parcours. Répondez avec vos vrais chiffres. « Je ne sais pas » est une réponse acceptée, et c''est déjà une information utile.',
   'Mon business marche moyennement, je vends de temps en temps.',
   'Coaching nutrition à 50 000 FCFA. 4 ventes ces 3 derniers mois, toutes par bouche-à-oreille. Environ 12 personnes intéressées ce mois-ci sur WhatsApp. Pas de page de vente, pas de relance.',
   '[{"cle":"offre_actuelle","libelle":"Votre offre actuelle et son prix","aide":"Ce que vous vendez aujourd''hui et à combien.","type":"texte_long","obligatoire":true,"prerempli_depuis":{"profil":"main_offer"}},{"cle":"ventes_3_mois","libelle":"Nombre de ventes ces 3 derniers mois","type":"nombre","obligatoire":true},{"cle":"ca_3_mois","libelle":"Chiffre d''affaires ces 3 derniers mois (FCFA)","type":"nombre","obligatoire":true},{"cle":"interesses_mois","libelle":"Nombre de personnes intéressées ce mois-ci","aide":"Messages, demandes de prix, commentaires ''intéressé''.","type":"nombre","obligatoire":true},{"cle":"offre","libelle":"Pouvez-vous dire en une phrase pour qui est votre offre et quel résultat elle apporte ?","type":"choix","obligatoire":true,"options":["Non","Oui, mais c''est flou","Oui, clairement"],"points":[0,5,10]},{"cle":"positionnement","libelle":"Savez-vous précisément qui est votre client idéal (métier, situation) ?","type":"choix","obligatoire":true,"options":["Non","Vaguement","Oui, je peux le décrire"],"points":[0,5,10]},{"cle":"audience","libelle":"Taille de votre audience totale (abonnés, contacts WhatsApp, emails)","type":"choix","obligatoire":true,"options":["Moins de 100","100 à 1 000","1 000 à 5 000","Plus de 5 000"],"points":[0,3,6,10]},{"cle":"acquisition","libelle":"D''où viennent vos clients ?","type":"choix","obligatoire":true,"options":["Je ne sais pas","Uniquement le bouche-à-oreille","Un canal régulier (réseaux, pub, partenaires)","Plusieurs canaux réguliers"],"points":[0,3,7,10]},{"cle":"captureDeLeads","libelle":"Avez-vous un moyen de récupérer les contacts de vos prospects (ressource gratuite, formulaire, liste) ?","type":"choix","obligatoire":true,"options":["Non","Oui, mais peu utilisé","Oui, et il fonctionne"],"points":[0,5,10]},{"cle":"funnel","libelle":"Existe-t-il un parcours clair jusqu''au paiement (page de vente, lien de paiement) ?","type":"choix","obligatoire":true,"options":["Non, tout se fait en conversation","En partie","Oui, en ligne"],"points":[0,5,10]},{"cle":"conversion","libelle":"Sur 10 personnes intéressées, combien achètent ?","type":"choix","obligatoire":true,"options":["Je ne sais pas ou aucune","1 à 2","3 à 4","5 ou plus"],"points":[0,4,7,10]},{"cle":"relance","libelle":"Relancez-vous les personnes qui n''ont pas acheté ?","type":"choix","obligatoire":true,"options":["Jamais","Parfois, à la main","Oui, avec une séquence prête"],"points":[0,5,10]},{"cle":"analytics","libelle":"Connaissez-vous vos chiffres du mois dernier (prospects, ventes, chiffre d''affaires) ?","type":"choix","obligatoire":true,"options":["Non","En partie","Oui, je les note"],"points":[0,5,10]}]',
   '["Les chiffres (ventes, chiffre d''affaires, personnes intéressées) sont renseignés honnêtement.","Les réponses sont cohérentes entre elles.","L''offre actuelle est décrite avec son prix."]'),
  ((select id from public.stages where number = 1), '1.2', 2, 2, 'Fixer votre objectif à 90 jours', 'Sans ligne d''arrivée, impossible de savoir si le parcours vous fait progresser.', 15, 2, true,
   'Sans ligne d''arrivée, impossible de savoir si le parcours vous fait progresser. Un bon objectif est chiffré, assez ambitieux pour vous motiver, mais réaliste par rapport à votre point de départ et au temps dont vous disposez.',
   'Je veux vivre de mon business.',
   '600 000 FCFA de chiffre d''affaires en 90 jours, soit 12 ventes à 50 000 FCFA, 1 par semaine. J''ai 5 h par semaine. Ce qui m''a bloqué : je ne relance jamais les personnes intéressées.',
   '[{"cle":"ca_vise","libelle":"Chiffre d''affaires visé dans 90 jours (FCFA)","type":"nombre","obligatoire":true},{"cle":"prix_moyen","libelle":"Prix moyen d''une vente (FCFA)","type":"nombre","obligatoire":true,"prerempli_depuis":{"profil":"price"}},{"cle":"temps_semaine","libelle":"Temps disponible par semaine pour votre activité","type":"choix","obligatoire":true,"options":["Moins de 3 h","3 à 5 h","5 à 10 h","Plus de 10 h"]},{"cle":"blocage","libelle":"Ce qui vous a le plus bloqué jusqu''ici","aide":"Soyez concret : ''je ne relance jamais'', pas ''le manque de motivation''.","type":"texte_long","obligatoire":true},{"cle":"motivation","libelle":"Pourquoi cet objectif compte pour vous","type":"texte_long","obligatoire":true}]',
   '["L''objectif est chiffré en FCFA et en nombre de ventes.","Il est réaliste par rapport au point de départ et au temps disponible.","Le blocage cité est concret."]');

-- Missions guidées étape 2
insert into public.missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
values
  ((select id from public.stages where number = 2), '2.1', 3, 1, 'Formuler votre promesse', 'Dites en une phrase claire pour qui vous êtes, quel résultat vous apportez, en combien de temps et sans quelle contrainte.', 30, 1, true,
   'Un prospect décide en quelques secondes si votre offre est pour lui. Si votre promesse est vague, il passe son chemin, même si votre accompagnement est excellent. Une bonne promesse dit pour qui c''est, quel résultat on obtient, en combien de temps, et sans quel obstacle.',
   'J''accompagne les femmes entrepreneures à développer leur business.',
   'J''aide les couturières qui vendent sur WhatsApp à obtenir 10 commandes de plus par mois en 60 jours, sans payer de publicité.',
   '[{"cle":"pour_qui","libelle":"Pour qui ?","aide":"Un métier et une situation précise : \"les coachs sportifs qui débutent en ligne\", pas \"tout le monde\".","type":"texte","obligatoire":true},{"cle":"probleme","libelle":"Quel problème les empêche de dormir ?","aide":"Avec leurs mots à eux, ceux qu''ils vous disent en conversation.","type":"texte_long","obligatoire":true},{"cle":"resultat","libelle":"Quel résultat concret obtiennent-ils ?","aide":"Un chiffre ou un changement visible.","type":"texte","obligatoire":true},{"cle":"delai","libelle":"En combien de temps ?","type":"texte","obligatoire":true},{"cle":"sans_obstacle","libelle":"Sans quel obstacle ou quelle contrainte ?","aide":"Par exemple : sans y passer ses soirées, sans budget pub.","type":"texte","obligatoire":true},{"cle":"promesse","libelle":"Votre promesse en une phrase","aide":"J''aide [pour qui] à [résultat] en [délai] sans [obstacle].","type":"texte_long","obligatoire":true}]',
   '["La cible est nommée par un métier ou une situation, jamais par « tout le monde » ou « les entrepreneurs ».","Le résultat est mesurable ou observable.","Un inconnu comprend la promesse en moins de 10 secondes."]'),
  ((select id from public.stages where number = 2), '2.2', 4, 2, 'Construire votre package', 'Décrivez semaine après semaine ce que le client reçoit, pour qu''il visualise le parcours avant d''acheter.', 40, 2, true,
   'Le client n''achète pas « un accompagnement ». Il achète ce qu''il va recevoir, semaine après semaine. Plus il visualise le parcours, plus l''achat lui paraît sûr.',
   'Suivi de 3 mois avec des points réguliers.',
   'Programme Atelier Plein, 8 semaines. Semaine 1 : audit de votre catalogue WhatsApp. Semaines 2 et 3 : 3 modèles de messages de relance prêts à envoyer. Chaque semaine : 1 h de séance de groupe. Semaine 6 : revue de vos prix. Bonus : groupe d''entraide des participantes.',
   '[{"cle":"nom_offre","libelle":"Nom de votre offre","type":"texte","obligatoire":true},{"cle":"format","libelle":"Format","options":["Accompagnement individuel","Accompagnement de groupe","Formation","Service réalisé pour le client","Produit"],"type":"choix","obligatoire":true},{"cle":"duree","libelle":"Durée totale","type":"texte","obligatoire":true},{"cle":"elements","libelle":"Ce que le client reçoit concrètement","aide":"Pour chaque élément, précisez à quoi il sert.","type":"liste","obligatoire":true,"min_lines":3,"max_lines":6},{"cle":"etapes","libelle":"Les étapes du parcours client, dans l''ordre","type":"liste","obligatoire":true,"min_lines":3,"max_lines":5},{"cle":"bonus","libelle":"Bonus","type":"texte_long","obligatoire":false},{"cle":"non_inclus","libelle":"Ce qui n''est PAS inclus","aide":"Ça évite les malentendus et les demandes hors cadre.","type":"texte_long","obligatoire":true}]',
   '["Chaque élément reçu sert directement la promesse de la mission 2.1.","Le client peut se représenter ce qui se passe à chaque étape.","Il n''y a pas plus de 6 éléments."]'),
  ((select id from public.stages where number = 2), '2.3', 5, 3, 'Fixer votre prix et votre garantie', 'Positionnez votre prix par rapport à la valeur du résultat pour le client, et ajoutez une garantie que vous pouvez tenir.', 30, 3, true,
   'Un prix se juge par rapport à ce que le résultat rapporte au client, pas par rapport à vos heures de travail. Une garantie bien pensée enlève la dernière hésitation, sans vous mettre en danger.',
   'Prix : 150 000 FCFA.',
   '150 000 FCFA, ou 2 fois 80 000 FCFA. Dix commandes de plus par mois à 15 000 FCFA de marge, c''est 150 000 FCFA gagnés dès le premier mois. Garantie : si vous avez réalisé toutes les missions et que vous n''avez aucune commande supplémentaire au bout de 8 semaines, on continue ensemble gratuitement pendant 4 semaines.',
   '[{"cle":"prix","libelle":"Prix (FCFA)","type":"nombre","obligatoire":true},{"cle":"modalites","libelle":"Modalités de paiement","options":["En une fois","En 2 ou 3 fois","Mensuel"],"type":"choix","obligatoire":true},{"cle":"valeur_client","libelle":"Combien le résultat rapporte ou fait économiser au client (FCFA)","type":"nombre","obligatoire":true},{"cle":"garantie","libelle":"Votre garantie","aide":"Prolonger l''accompagnement est souvent plus tenable qu''un remboursement.","type":"texte_long","obligatoire":true},{"cle":"objections","libelle":"Les 3 objections que vous entendez le plus, et votre réponse à chacune","type":"liste","obligatoire":true,"min_lines":3,"max_lines":3},{"cle":"offre_complete","libelle":"Votre offre complète en 3 lignes : promesse, contenu, prix et garantie","type":"texte_long","obligatoire":true}]',
   '["Le résultat vaut au moins 5 fois le prix pour le client, avec un calcul visible.","La garantie est claire et vous pouvez la tenir.","Aucune fausse urgence : s''il y a une limite de places ou de date, elle est réelle."]');

-- Supprimer la contrainte unique sur number et ajouter les nouvelles contraintes
alter table public.missions drop constraint if exists missions_number_key;
alter table public.missions add constraint missions_code_key unique (code);
alter table public.missions add constraint missions_stage_ordre_key unique (stage_id, ordre);

-- ============================================================================
-- SEED: Resources (étapes 1-8)
-- ============================================================================
insert into public.resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-diagnostic-funnel', 'Comprendre et lire votre Funnel Score',
  'Ce qu''il faut regarder avant de changer quoi que ce soit dans votre système de vente.',
  'guide',
  '[{"type":"paragraph","text":"Avant de changer votre offre, votre site ou vos publicités, il faut savoir où se situe réellement la fuite dans votre système de vente. La plupart des entrepreneurs corrigent le mauvais problème parce qu''ils n''ont jamais mesuré les quatre zones qui déterminent leurs ventes."},{"type":"heading","text":"Les 4 zones à auditer"},{"type":"list","items":["Trafic — Est-ce qu''assez de personnes découvrent votre offre chaque semaine ?","Conversion — Parmi les visiteurs, combien deviennent des prospects (email, DM, appel) ?","Offre — Votre proposition est-elle assez claire et désirable pour déclencher une décision d''achat ?","Fidélisation — Vos clients reviennent-ils, ou chaque vente part-elle de zéro ?"]},{"type":"heading","text":"Comment lire votre Funnel Score"},{"type":"paragraph","text":"Le score n''est pas une note de qualité générale : c''est un indicateur de la zone la plus faible parmi les quatre. Un score bas signifie qu''une zone tire l''ensemble vers le bas — ce n''est presque jamais les quatre en même temps."},{"type":"heading","text":"Vos 3 priorités"},{"type":"paragraph","text":"Une fois le diagnostic fait, ne travaillez que sur les 3 priorités qu''il vous donne, dans l''ordre. Ajouter une cinquième action en parallèle dilue l''effort et retarde les résultats mesurables."}]'::jsonb,
  1 from public.stages where number = 1 on conflict (slug) do nothing;

insert into public.resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-offre-irresistible', 'Construire une offre irrésistible',
  'La méthode pour transformer votre expertise en offre claire, désirable et vendable.',
  'guide',
  '[{"type":"paragraph","text":"Une offre irrésistible n''est pas la plus complète ni la moins chère : c''est celle dont la transformation promise est immédiatement comprise et désirée par la bonne personne."},{"type":"heading","text":"Les 4 piliers d''une offre qui se vend"},{"type":"list","items":["Promesse — un résultat précis, pas une méthode (doublez vos rendez-vous en 30 jours, pas accompagnement marketing)","Transformation — l''état avant/après doit être visible et mesurable pour le client","Preuve — un exemple concret, un chiffre, un témoignage qui rend la promesse crédible","Prix — positionné par rapport à la valeur du résultat, pas par rapport à votre temps passé"]},{"type":"heading","text":"Erreur la plus fréquente"},{"type":"paragraph","text":"Décrire ce que vous faites (je fais du coaching, je propose un accompagnement) au lieu de décrire ce que le client obtient. Réécrivez votre offre en commençant par le résultat, jamais par la méthode."}]'::jsonb,
  1 from public.stages where number = 2 on conflict (slug) do nothing;

insert into public.resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-cible-positionnement', 'Clarifier qui vous servez',
  'Définir précisément votre client idéal et le message qui lui parle.',
  'guide',
  '[{"type":"paragraph","text":"Un message qui s''adresse à tout le monde ne convainc personne. Le positionnement commence par une décision inconfortable : accepter de ne pas convenir à tout le monde."},{"type":"heading","text":"La question qui structure tout"},{"type":"paragraph","text":"Qui je sers, et surtout qui je ne sers pas ? Listez 3 profils que vous refuseriez comme clients, même s''ils payaient. Ce qui reste après exclusion, c''est votre cible réelle."},{"type":"heading","text":"Votre message de positionnement en une phrase"},{"type":"paragraph","text":"J''aide [cible précise] à [résultat précis] sans [objection ou friction principale]. Testez cette phrase à voix haute : si elle ne se dit pas naturellement en une respiration, elle est encore trop vague."},{"type":"heading","text":"Vérifier le positionnement"},{"type":"list","items":["Un inconnu du secteur comprend-il en 5 secondes à qui vous vous adressez ?","Un client idéal se reconnaît-il immédiatement dans la description ?","Le message exclut-il clairement ceux qui ne sont pas concernés ?"]}]'::jsonb,
  1 from public.stages where number = 3 on conflict (slug) do nothing;

insert into public.resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-lead-magnet', 'Créer un lead magnet qui capture de vrais prospects',
  'Les critères d''une ressource gratuite qui génère des contacts qualifiés, pas juste des téléchargements.',
  'guide',
  '[{"type":"paragraph","text":"Un bon lead magnet ne prouve pas que vous savez beaucoup de choses : il résout un problème précis, immédiat, pour un public précis — en échange d''un email ou d''un contact."},{"type":"heading","text":"Les critères d''un lead magnet efficace"},{"type":"list","items":["Spécifique — un seul problème, pas un aperçu général de votre expertise","Rapide à consommer — 5 à 15 minutes, pas un cours complet","Actionnable — la personne doit pouvoir l''utiliser tout de suite, sans vous","Connecté à votre offre — sa réussite doit naturellement mener vers l''étape payante suivante"]},{"type":"heading","text":"Formats qui fonctionnent bien"},{"type":"list","items":["Checklist ou template prêt à l''emploi","Diagnostic ou quiz personnalisé","Script (email, appel, message de vente)","Courte vidéo tutoriel"]},{"type":"heading","text":"Le promouvoir"},{"type":"paragraph","text":"Un lead magnet caché sur votre site ne sert à rien. Créez au moins un contenu qui pointe directement dessus par canal d''acquisition actif, avec un appel à l''action explicite."}]'::jsonb,
  1 from public.stages where number = 4 on conflict (slug) do nothing;

insert into public.resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-premier-canal-acquisition', 'Lancer un canal d''acquisition qui tient dans la durée',
  'Pourquoi choisir un seul canal au départ, et comment le rendre régulier.',
  'guide',
  '[{"type":"paragraph","text":"La plupart des entrepreneurs dispersent leur énergie sur plusieurs canaux à la fois et n''en maîtrisent aucun. Un seul canal, travaillé avec régularité pendant 90 jours, produit plus de résultats que cinq canaux touchés une fois par semaine chacun."},{"type":"heading","text":"Choisir votre canal"},{"type":"paragraph","text":"Posez-vous une seule question : où votre cible passe-t-elle déjà du temps à chercher une solution à son problème ? Ce n''est pas une question de préférence personnelle pour un réseau social."},{"type":"heading","text":"Le principe de régularité"},{"type":"paragraph","text":"Un algorithme ou un réseau de recommandation récompense la fréquence avant la perfection. Une publication moyenne chaque semaine bat une publication parfaite chaque trimestre."},{"type":"heading","text":"3 types de contenu qui génèrent des leads"},{"type":"list","items":["Preuve — résultats clients, avant/après, chiffres","Éducation — une erreur fréquente de votre cible et comment l''éviter","Invitation — un appel direct à essayer votre lead magnet ou votre offre"]}]'::jsonb,
  1 from public.stages where number = 5 on conflict (slug) do nothing;

insert into public.resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-page-de-vente', 'Structurer une page de vente qui convertit',
  'Les sections indispensables, dans l''ordre, pour transformer un visiteur en client.',
  'guide',
  '[{"type":"paragraph","text":"Une page de vente n''est pas une brochure : c''est une conversation écrite qui répond, dans l''ordre, aux objections que votre visiteur se pose avant de sortir sa carte bancaire."},{"type":"heading","text":"La structure qui fonctionne"},{"type":"list","items":["Accroche — le résultat promis, en une phrase, avant tout le reste","Problème — décrire la situation actuelle du visiteur pour qu''il se reconnaisse","Solution — votre offre, présentée comme le chemin vers le résultat","Preuve — témoignages, résultats chiffrés, exemples concrets","Détail de l''offre — ce qui est inclus, clairement listé","Appel à l''action — un bouton unique et répété, pas dix choix différents","Garantie et FAQ — lever les dernières objections avant la sortie"]},{"type":"heading","text":"Erreur à éviter"},{"type":"paragraph","text":"Ne mettez jamais l''appel à l''action seulement en bas de page. Un visiteur prêt à acheter dès l''accroche doit pouvoir le faire immédiatement, sans scroller."}]'::jsonb,
  1 from public.stages where number = 6 on conflict (slug) do nothing;

insert into public.resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-sequence-relance', 'Mettre en place une relance qui convertit sans forcer',
  'Une séquence de 3 messages pour récupérer les prospects qui n''ont pas encore acheté.',
  'guide',
  '[{"type":"paragraph","text":"La majorité des ventes ne se font pas au premier contact. Sans relance, vous perdez silencieusement la plupart des prospects qui étaient pourtant intéressés."},{"type":"heading","text":"La séquence en 3 messages"},{"type":"list","items":["Message 1 (J+1) — rappel simple de l''offre, sans pression, en réaffirmant le résultat promis","Message 2 (J+3) — traiter l''objection la plus fréquente que vous recevez habituellement","Message 3 (J+7) — dernier rappel avec une raison d''agir maintenant (place limitée, tarif qui évolue — uniquement si c''est vrai)"]},{"type":"heading","text":"Le ton à adopter"},{"type":"paragraph","text":"Chaque message doit apporter quelque chose de nouveau — une réponse, une preuve, une clarification — jamais seulement vous avez vu mon offre ?. Une relance qui n''apporte rien est ignorée, à raison."}]'::jsonb,
  1 from public.stages where number = 7 on conflict (slug) do nothing;

insert into public.resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-suivi-metriques-cles', 'Suivre les métriques qui comptent vraiment',
  'Le rituel hebdomadaire pour piloter votre système de vente au lieu de le subir.',
  'guide',
  '[{"type":"paragraph","text":"On ne peut pas améliorer ce qu''on ne mesure pas. Mais suivre vingt indicateurs revient à n''en suivre aucun : concentrez-vous sur les trois qui pilotent réellement votre activité."},{"type":"heading","text":"Les 3 métriques clés"},{"type":"list","items":["Nombre de nouveaux leads par semaine","Taux de conversion lead → client","Revenu généré sur la période"]},{"type":"heading","text":"Le rituel hebdomadaire"},{"type":"paragraph","text":"Chaque semaine, à heure fixe, notez ces trois chiffres. Comparez-les à la semaine précédente. Une baisse sur une métrique vous indique exactement où revenir dans les étapes précédentes de votre Parcours."},{"type":"heading","text":"Ce qu''il ne faut pas faire"},{"type":"paragraph","text":"Changer plusieurs choses en même temps (offre, canal, prix) rend impossible de savoir ce qui a réellement fait varier vos résultats. Une variable à la fois, mesurée sur au moins deux semaines."}]'::jsonb,
  1 from public.stages where number = 8 on conflict (slug) do nothing;

select 'Migration et seed appliqués avec succès !' as result;
