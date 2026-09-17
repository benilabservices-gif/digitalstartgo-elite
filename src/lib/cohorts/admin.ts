import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Garde d'accès des pages admin. Le vrai verrou reste RLS (`public.is_admin()`
 * côté base) : cette fonction sert uniquement à rediriger proprement un
 * utilisateur non-admin au lieu de lui afficher une page vide.
 */
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return { supabase, user };
}
