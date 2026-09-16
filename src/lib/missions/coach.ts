import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
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

interface ParticipantNameRow {
  id: string;
  business_name: string | null;
}

/**
 * Récupère les noms commerciaux des participants concernés.
 *
 * Un coach n'a délibérément aucun droit de lecture direct sur `profiles` : cela
 * lui donnerait aussi le prix, l'objectif mensuel, l'offre et la taille
 * d'audience de tous les participants. La fonction SQL `coach_participant_names`
 * ne renvoie que l'identifiant et le nom commercial.
 */
export async function fetchParticipantNames(
  supabase: SupabaseClient,
  profileIds: readonly (string | undefined)[]
): Promise<Map<string, string | null>> {
  const uniqueIds = Array.from(
    new Set(profileIds.filter((id): id is string => typeof id === "string"))
  );

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data } = await supabase.rpc("coach_participant_names", {
    p_profile_ids: uniqueIds,
  });

  const rows = (data ?? []) as ParticipantNameRow[];
  return new Map(rows.map((row) => [row.id, row.business_name]));
}
