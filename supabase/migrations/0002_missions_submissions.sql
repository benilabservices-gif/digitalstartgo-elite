-- Missions : soumission de livrable par le participant, revue par un coach humain.
-- Cette migration ajoute le rôle utilisateur, la table d'historique des soumissions,
-- les policies RLS associées et les triggers qui gardent mission_progress cohérent.
--
-- Toutes les fonctions fixent `search_path = public, pg_temp` : sans mention
-- explicite de pg_temp, PostgreSQL le place implicitement en tête du chemin de
-- recherche, ce qui permet à un utilisateur de masquer une table ou une fonction
-- par un objet temporaire homonyme.

-- ---------------------------------------------------------------------------
-- 1. Rôle utilisateur
-- ---------------------------------------------------------------------------

-- Le rôle 'admin' est accepté par la contrainte mais volontairement inerte pour
-- ce MVP : is_coach() ne teste que 'coach', un admin n'a donc aucun accès à la
-- revue. La gestion des rôles fera l'objet d'un plan dédié.
alter table profiles
  add column role text not null default 'participant'
    check (role in ('participant', 'coach', 'admin'));

-- La ligne profiles est créée ET mise à jour par le client (upsert de
-- l'onboarding). Les policies de 0001 ne contrôlent que `auth.uid() = id`, sans
-- jamais regarder `role` : sans ce trigger, n'importe quel inscrit pourrait
-- poser role = 'coach' dès l'INSERT, ou se promouvoir plus tard par UPDATE.
-- auth.uid() est nul pour la clé service_role et dans l'éditeur SQL : la
-- promotion manuelle par un administrateur reste possible.
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

create trigger profiles_prevent_role_self_update
  before insert or update on profiles
  for each row execute function public.prevent_role_self_update();

-- Test d'appartenance au rôle coach. SECURITY DEFINER est indispensable : la
-- fonction est appelée depuis les policies de mission_progress et
-- mission_submissions, un accès soumis à RLS provoquerait une récursion.
create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'coach'
  );
$$;

-- L'interface coach n'a besoin que du nom commercial du participant. Plutôt
-- qu'une policy select sur profiles — qui exposerait prix, objectif mensuel,
-- taille d'audience et offre de tous les participants — le coach passe par
-- cette fonction, qui ne renvoie que les deux colonnes nécessaires.
create or replace function public.coach_participant_names(p_profile_ids uuid[])
returns table (id uuid, business_name text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.business_name
  from public.profiles p
  where public.is_coach()
    and p.id = any(p_profile_ids);
$$;

revoke execute on function public.coach_participant_names(uuid[]) from public;
grant execute on function public.coach_participant_names(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Soumissions
-- ---------------------------------------------------------------------------

create table mission_submissions (
  id uuid primary key default gen_random_uuid(),
  mission_progress_id uuid not null references mission_progress(id) on delete cascade,
  -- Borne serveur : la limite côté client ne protège pas d'un appel direct.
  contenu text not null check (length(btrim(contenu)) between 1 and 4000),
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

-- Une seule soumission en attente par mission : empêche un participant de noyer
-- la file de revue en insérant des soumissions en boucle.
create unique index mission_submissions_one_pending_idx
  on mission_submissions (mission_progress_id)
  where statut = 'soumis';

alter table mission_submissions enable row level security;

-- Un participant lit uniquement les soumissions rattachées à sa propre progression.
create policy "mission_submissions_select_own" on mission_submissions
  for select to authenticated using (
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
  for insert to authenticated with check (
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
  for select to authenticated using (public.is_coach());

-- Un coach traite une soumission : uniquement vers 'valide' ou 'a_corriger',
-- et en signant la correction de son propre identifiant. Ce que le WITH CHECK
-- ne peut pas exprimer (comparaison avec l'ancienne ligne) est porté par le
-- trigger guard_submission_update ci-dessous.
create policy "mission_submissions_update_coach" on mission_submissions
  for update to authenticated using (public.is_coach())
  with check (
    public.is_coach()
    and statut in ('valide', 'a_corriger')
    and corrige_par = auth.uid()
  );

-- Une policy RLS ne voit que NEW : impossible d'y exprimer « le livrable ne
-- change pas » ou « la soumission n'a pas déjà été traitée ». Sans ce trigger,
-- un coach pourrait, par un PATCH direct, réécrire le contenu soumis, le
-- rattacher à une autre progression, ou rouvrir une mission déjà validée et
-- désynchroniser mission_progress.
create or replace function public.guard_submission_update()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.contenu is distinct from old.contenu
     or new.mission_progress_id is distinct from old.mission_progress_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Le livrable soumis est immuable.';
  end if;

  if old.statut <> 'soumis' then
    raise exception 'Cette soumission a déjà été traitée.';
  end if;

  return new;
end;
$$;

create trigger mission_submissions_guard_update
  before update on mission_submissions
  for each row execute function public.guard_submission_update();

-- ---------------------------------------------------------------------------
-- 3. Verrouillage des écritures du participant sur mission_progress
-- ---------------------------------------------------------------------------

create policy "mission_progress_select_coach" on mission_progress
  for select to authenticated using (public.is_coach());

-- La policy "mission_progress_all_own" (0001) est un FOR ALL : elle laissait un
-- participant écrire n'importe quel statut sur sa propre ligne, y compris
-- 'valide', et supprimer sa progression (donc l'historique des soumissions par
-- cascade). Elle est remplacée par des droits d'écriture limités aux statuts
-- que le participant a le droit de produire lui-même. Les statuts 'soumis',
-- 'a_corriger' et 'valide' ne peuvent plus venir que du trigger de
-- synchronisation, en SECURITY DEFINER.
drop policy "mission_progress_all_own" on mission_progress;

create policy "mission_progress_insert_own" on mission_progress
  for insert to authenticated with check (
    auth.uid() = profile_id
    and status in ('a_faire', 'en_cours')
  );

create policy "mission_progress_update_own" on mission_progress
  for update to authenticated using (
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
set search_path = public, pg_temp
as $$
declare
  progress_status text;
begin
  select status into progress_status
  from public.mission_progress
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
set search_path = public, pg_temp
as $$
begin
  update public.mission_progress
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
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Nommé pour passer après mission_submissions_guard_update : à type et moment
-- égaux, PostgreSQL déclenche les triggers dans l'ordre alphabétique.
create trigger mission_submissions_touch_updated_at
  before update on mission_submissions
  for each row execute function public.touch_updated_at();
