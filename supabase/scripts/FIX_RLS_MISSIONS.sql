-- ============================================================================
-- CORRIGER LES POLITIQUES RLS — Tables missions, mission_progress, etc.
-- ============================================================================
-- Exécuter dans le SQL Editor de Supabase Dashboard
-- https://supabase.com/dashboard/project/digitalstartgo-elite/sql
-- ============================================================================

-- 1. Missions — permettre la lecture à tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "missions_select_authenticated" ON public.missions;
CREATE POLICY "missions_select_authenticated" ON public.missions
  FOR SELECT TO authenticated USING (auth.role() = 'authenticated');

-- 2. Mission Progress — permettre la lecture à son propre profil
DROP POLICY IF EXISTS "mission_progress_select_own" ON public.mission_progress;
CREATE POLICY "mission_progress_select_own" ON public.mission_progress
  FOR SELECT TO authenticated USING (auth.uid() = profile_id);

-- 3. Mission Submissions — permettre la lecture et l'insertion
DROP POLICY IF EXISTS "mission_submissions_select_own" ON public.mission_submissions;
DROP POLICY IF EXISTS "mission_submissions_insert_own" ON public.mission_submissions;
CREATE POLICY "mission_submissions_select_own" ON public.mission_submissions
  FOR SELECT TO authenticated USING (
    auth.uid() IN (SELECT profile_id FROM mission_progress WHERE id = mission_progress_id)
    OR auth.uid() = corrige_par
  );
CREATE POLICY "mission_submissions_insert_own" ON public.mission_submissions
  FOR INSERT TO authenticated WITH CHECK (
    statut = 'soumis' AND feedback_coach IS NULL AND corrige_par IS NULL
    AND EXISTS (SELECT 1 FROM mission_progress mp WHERE mp.id = mission_submissions.mission_progress_id AND mp.profile_id = auth.uid())
  );

-- 4. Stages — permettre la lecture
DROP POLICY IF EXISTS "stages_select_authenticated" ON public.stages;
CREATE POLICY "stages_select_authenticated" ON public.stages
  FOR SELECT TO authenticated USING (auth.role() = 'authenticated');

-- 5. Resources — permettre la lecture
DROP POLICY IF EXISTS "resources_select_authenticated" ON public.resources;
CREATE POLICY "resources_select_authenticated" ON public.resources
  FOR SELECT TO authenticated USING (auth.role() = 'authenticated');

-- Vérification
SELECT 'RLS corrigé — Les tables sont maintenant accessibles aux utilisateurs authentifiés' as result;
