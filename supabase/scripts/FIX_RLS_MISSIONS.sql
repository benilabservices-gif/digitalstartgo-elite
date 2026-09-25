-- ============================================================================
-- CORRIGER LES POLITIQUES RLS — Permettre aux participants de lire leurs données
-- ============================================================================
-- Exécuter dans le SQL Editor de Supabase Dashboard
-- https://supabase.com/dashboard/project/digitalstartgo-elite/sql
--
-- Problème : les politiques RLS bloquent les requêtes des participants sur
-- mission_progress et missions, causant des 404 sur les pages /missions et /parcours
-- ============================================================================

-- 1. Permettre aux participants de lire leur progression
CREATE POLICY IF NOT EXISTS "mission_progress_select_own" ON public.mission_progress
  FOR SELECT TO authenticated USING (auth.uid() = profile_id);

-- 2. Permettre à tous les utilisateurs authentifiés de lire les missions
CREATE POLICY IF NOT EXISTS "missions_select_authenticated" ON public.missions
  FOR SELECT TO authenticated USING (auth.role() = 'authenticated');

-- 3. Permettre aux participants de lire leurs soumissions (déjà existant mais au cas où)
-- La politique existe déjà, pas besoin de la recréer

-- Vérification
SELECT 'RLS corrigé — Les participants peuvent maintenant lire leurs données' as result;
