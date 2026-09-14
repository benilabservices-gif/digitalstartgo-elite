-- Missions : soumission de livrable par le participant, revue par un coach humain.
-- Cette migration ajoute le rôle utilisateur, la table d'historique des soumissions,
-- les policies RLS associées et les triggers qui gardent mission_progress cohérent.

-- ---------------------------------------------------------------------------
-- 1. Rôle utilisateur
-- ---------------------------------------------------------------------------

alter table profiles
  add column role text not null default 'participant'
    check (role in ('participant', 'coach', 'admin'));

-- La policy "profiles_update_own" (0001) autorise un participant à mettre à jour
-- sa propre ligne sans WITH CHECK restrictif : sans garde-fou, il pourrait donc
-- se promouvoir coach depuis une simple requête réseau. Ce trigger interdit toute
-- modification de `role` provenant d'un client authentifié. auth.uid() est nul
-- pour la clé service_role et dans l'éditeur SQL : la promotion manuelle par un
-- administrateur reste possible.
create or replace function public.prevent_role_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Le rôle ne peut pas être modifié depuis l''application.';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_self_update
  before update on profiles
  for each row execute function public.prevent_role_self_update();

-- Test d'appartenance au rôle coach. SECURITY DEFINER est indispensable : la
-- fonction est appelée depuis les policies de profiles, un accès soumis à RLS
-- provoquerait une récursion infinie.
create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'coach'
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Soumissions
-- ---------------------------------------------------------------------------

create table mission_submissions (
  id uuid primary key default gen_random_uuid(),
  mission_progress_id uuid not null references mission_progress(id) on delete cascade,
  contenu text not null check (length(btrim(contenu)) > 0),
  statut text not null default 'soumis'
    check (statut in ('soumis', 'a_corriger', 'valide')),
  feedback_coach text,
  corrige_par uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mission_submissions_progress_idx
  on mission_submissions (mission_progress_id, created_at desc);
create index mission_submissions_queue_idx
  on mission_submissions (statut, created_at);

alter table mission_submissions enable row level security;

-- Un participant lit uniquement les soumissions rattachées à sa propre progression.
create policy "mission_submissions_select_own" on mission_submissions
  for select using (
    exists (
      select 1 from mission_progress mp
      where mp.id = mission_submissions.mission_progress_id
        and mp.profile_id = auth.uid()
    )
  );

-- Un participant crée une soumission sur sa propre progression, et uniquement
-- avec le statut initial 'soumis'. Il ne peut ni s'auto-valider, ni écrire un
-- feedback, ni s'attribuer la correction.
create policy "mission_submissions_insert_own" on mission_submissions
  for insert with check (
    statut = 'soumis'
    and feedback_coach is null
    and corrige_par is null
    and exists (
      select 1 from mission_progress mp
      where mp.id = mission_submissions.mission_progress_id
        and mp.profile_id = auth.uid()
    )
  );

-- Aucune policy UPDATE ni DELETE pour le participant : une soumission est
-- immuable de son côté, l'historique des tentatives est donc conservé.

-- Un coach voit toutes les soumissions (pas de cohortes pour ce MVP).
create policy "mission_submissions_select_coach" on mission_submissions
  for select using (public.is_coach());

-- Un coach traite une soumission : uniquement vers 'valide' ou 'a_corriger',
-- et en signant la correction de son propre identifiant.
create policy "mission_submissions_update_coach" on mission_submissions
  for update using (public.is_coach())
  with check (
    public.is_coach()
    and statut in ('valide', 'a_corriger')
    and corrige_par = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- 3. Accès coach en lecture sur le contexte nécessaire à la revue
-- ---------------------------------------------------------------------------

create policy "profiles_select_coach" on profiles
  for select using (public.is_coach());

create policy "mission_progress_select_coach" on mission_progress
  for select using (public.is_coach());

-- ---------------------------------------------------------------------------
-- 3 bis. Verrouillage des écritures du participant sur mission_progress
-- ---------------------------------------------------------------------------

-- La policy "mission_progress_all_own" (0001) est un FOR ALL : elle laissait un
-- participant écrire n'importe quel statut sur sa propre ligne, y compris
-- 'valide', et supprimer sa progression (donc l'historique des soumissions par
-- cascade). Elle est remplacée par des droits d'écriture limités aux statuts
-- que le participant a le droit de produire lui-même. Les statuts 'soumis',
-- 'a_corriger' et 'valide' ne peuvent plus venir que du trigger de
-- synchronisation, en SECURITY DEFINER.
drop policy "mission_progress_all_own" on mission_progress;

create policy "mission_progress_insert_own" on mission_progress
  for insert with check (
    auth.uid() = profile_id
    and status in ('a_faire', 'en_cours')
  );

create policy "mission_progress_update_own" on mission_progress
  for update using (
    auth.uid() = profile_id
    and status in ('a_faire', 'en_cours')
  ) with check (
    auth.uid() = profile_id
    and status in ('a_faire', 'en_cours')
  );

-- Volontairement aucune policy DELETE : la progression et son historique ne
-- s'effacent pas depuis l'application.

-- ---------------------------------------------------------------------------
-- 4. Cohérence mission_progress <-> mission_submissions
-- ---------------------------------------------------------------------------

-- Une mission validée est définitive : on refuse une nouvelle soumission au
-- niveau de la base, pas seulement dans l'interface.
create or replace function public.assert_mission_not_validated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  progress_status text;
begin
  select status into progress_status
  from mission_progress
  where id = new.mission_progress_id;

  if progress_status is null then
    raise exception 'Progression de mission introuvable.';
  end if;

  if progress_status = 'valide' then
    raise exception 'Cette mission est déjà validée, elle ne peut plus être soumise.';
  end if;

  return new;
end;
$$;

create trigger mission_submissions_block_validated
  before insert on mission_submissions
  for each row execute function public.assert_mission_not_validated();

-- Le statut de mission_progress est dérivé de la dernière soumission. Le faire
-- en trigger SECURITY DEFINER évite d'ouvrir mission_progress en écriture aux
-- coachs et garantit que les deux tables ne peuvent jamais diverger, même si un
-- client appelle l'API PostgREST directement.
create or replace function public.sync_mission_progress_from_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update mission_progress
  set status = new.statut,
      updated_at = now()
  where id = new.mission_progress_id;
  return new;
end;
$$;

create trigger mission_submissions_sync_progress
  after insert or update of statut on mission_submissions
  for each row execute function public.sync_mission_progress_from_submission();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger mission_submissions_touch_updated_at
  before update on mission_submissions
  for each row execute function public.touch_updated_at();
