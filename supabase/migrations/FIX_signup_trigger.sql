-- ============================================================
-- FIX : Supprimer le trigger qui bloque l'inscription
-- Exécuter dans : https://pixdukzflnjkzqyqilfy.supabase.co/sql/new
-- ============================================================

-- 1. Supprimer TOUT trigger sur auth.users (sécurité)
DROP TRIGGER IF EXISTS auto_confirm_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_autoconfirm ON auth.users;
DROP TRIGGER IF EXISTS auto_confirm_on_signup ON auth.users;

-- 2. Supprimer les fonctions créées précédemment
DROP FUNCTION IF EXISTS public.auto_confirm_signup();
DROP FUNCTION IF EXISTS public.auto_confirm_on_signup();
DROP FUNCTION IF EXISTS public.confirm_user_by_id(uuid);

-- 3. Créer une fonction sécurisée pour auto-confirmer
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Confirmer l'utilisateur immédiatement
  UPDATE auth.users 
  SET confirmed_at = NOW(),
      email_confirmed_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- 4. Créer le trigger (autorisé seulement si permissions ok)
CREATE TRIGGER auto_confirm_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_new_user();

-- 5. Auto-confirmer les utilisateurs existants
UPDATE auth.users 
SET confirmed_at = COALESCE(confirmed_at, NOW()),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE confirmed_at IS NULL;
