import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { BottomNav } from "@/components/nav/BottomNav";
import type { ProfileRole } from "@/lib/profile/role";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: ProfileRole = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = (profile?.role as ProfileRole) ?? null;
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <SidebarNav role={role} />
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <BottomNav role={role} />
    </div>
  );
}
