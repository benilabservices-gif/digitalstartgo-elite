"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/lib/profile/role";

interface NavLinkItem {
  href: string;
  label: string;
}

const BASE_ITEMS: NavLinkItem[] = [
  { href: "/dashboard", label: "Mon Parcours" },
  { href: "/diagnostic", label: "Diagnostic" },
  { href: "/ressources", label: "Ressources" },
];

const COACH_ITEM: NavLinkItem = { href: "/coach", label: "Coach" };
const ADMIN_ITEMS: NavLinkItem[] = [
  { href: "/admin/cohorts", label: "Admin" },
  { href: "/admin/abonnements", label: "Abonnements" },
];

const COMING_SOON_LABELS = ["Virtuose AI", "Communauté"];

export function SidebarNav({ role }: { role: ProfileRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = [
    ...BASE_ITEMS,
    ...(role === "coach" ? [COACH_ITEM] : []),
    ...(role === "admin" ? ADMIN_ITEMS : []),
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="hidden w-64 flex-col gap-1 border-r border-dark/5 bg-white p-4 sm:flex">
      <p className="mb-4 px-2 text-lg font-extrabold text-ink">Virtuose Funnel</p>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            pathname === item.href ? "bg-ochre/10 text-ochre" : "text-secondary hover:bg-paper"
          }`}
        >
          {item.label}
        </Link>
      ))}
      {COMING_SOON_LABELS.map((label) => (
        <span
          key={label}
          className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-secondary/50"
        >
          {label}
          <span className="t-meta rounded-[2px] border border-dark/12 px-1.5 py-[1px] text-[10px] text-secondary/50">
            Bientôt
          </span>
        </span>
      ))}
      <button
        type="button"
        onClick={handleSignOut}
        className="mt-auto rounded-lg border-t border-dark/5 px-3 py-2 pt-4 text-left text-sm font-medium text-secondary hover:bg-paper"
      >
        Se déconnecter
      </button>
    </nav>
  );
}
