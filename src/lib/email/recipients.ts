import { createServiceClient } from "@/lib/supabase/server";

/**
 * Les adresses email ne sont pas dans `profiles` : elles sont dans `auth.users`,
 * lisible uniquement avec la clé service_role, via l'API admin de Supabase Auth.
 */
export async function getUserEmail(profileId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(profileId);
  if (error || !data?.user?.email) return null;
  return data.user.email;
}

export async function getEmailsForProfiles(profileIds: string[]): Promise<string[]> {
  const uniques = Array.from(new Set(profileIds.filter(Boolean)));
  const emails = await Promise.all(uniques.map((id) => getUserEmail(id)));
  return emails.filter((e): e is string => typeof e === "string");
}

export async function getAdminEmails(): Promise<string[]> {
  const supabase = createServiceClient();
  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
  return getEmailsForProfiles((admins ?? []).map((a: { id: string }) => a.id));
}
