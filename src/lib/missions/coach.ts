import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Garde d'accès des pages coach. Le vrai verrou reste RLS (`public.is_coach()`
 * côté base) : cette fonction sert uniquement à rediriger proprement un
 * participant vers son tableau de bord au lieu de lui afficher une page vide.
 */
export async function requireCoach() {
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

  if (profile?.role !== "coach") {
    redirect("/dashboard");
  }

  return { supabase, user };
}
