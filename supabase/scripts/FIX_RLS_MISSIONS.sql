-- ============================================================================
-- CORRIGER LES POLITIQUES RLS — Tables missions, mission_progress, mission_submissions
-- ============================================================================
-- Exécuter dans le SQL Editor de Supabase Dashboard
-- https://supabase.com/dashboard/project/digitalstartgo-elite/sql
--
-- Problème : les politiques RLS bloquent les requêtes du client Supabase
-- côté serveur, ce qui cause des 404 sur les pages /missions/[id]
-- ============================================================================

-- 1. Missions — permettre la lecture à tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "missions_select_authenticated" ON public.missions;
CREATE POLICY "missions_select_all" ON public.missions
  FOR SELECT TO authenticated USING (auth.role() = 'authenticated');

-- 2. Mission Progress — permettre la lecture à tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "mission_progress_select_own" ON public.mission_progress;
CREATE POLICY "mission_progress_select_all" ON public.mission_progress
  FOR SELECT TO authenticated USING (auth.role() = 'authenticated');

-- 3. Mission Submissions — permettre la lecture et l'insertion
DROP POLICY IF EXISTS "mission_submissions_select_own" ON public.mission_submissions;
DROP POLICY IF EXISTS "mission_submissions_insert_own" ON public.mission_submissions;
CREATE POLICY "mission_submissions_select_all" ON public.mission_submissions
  FOR SELECT TO authenticated USING (auth.role() = 'authenticated');
CREATE POLICY "mission_submissions_insert_all" ON public.mission_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

-- Vérification
SELECT 'RLS corrigé !' as result;
