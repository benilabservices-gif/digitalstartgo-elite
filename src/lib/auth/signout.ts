import { createClient } from "@/lib/supabase/client";

/**
 * Déconnecte l'utilisateur. Appelez router.push("/login") + router.refresh() après.
 */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
