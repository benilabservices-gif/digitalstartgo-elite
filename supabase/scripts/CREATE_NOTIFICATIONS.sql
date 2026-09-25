-- ============================================================================
-- CRÉER LA TABLE NOTIFICATIONS (requis pour le système de notifications)
-- ============================================================================
-- Copiez-collez ce SQL dans le SQL Editor de Supabase Dashboard
-- https://supabase.com/dashboard/project/digitalstartgo-elite/sql
-- ============================================================================

-- 1. Créer la table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS notifications_profile_idx ON public.notifications (profile_id, read, created_at DESC);

-- 3. Activer RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Politiques de sécurité
CREATE POLICY IF NOT EXISTS "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "notifications_insert_own" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

-- 5. Vérification
SELECT 'Table notifications créée avec succès !' as result;
