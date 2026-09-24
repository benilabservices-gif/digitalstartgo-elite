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
  order_index integer not null
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
