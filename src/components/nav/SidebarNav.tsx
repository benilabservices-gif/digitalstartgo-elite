"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard", label: "Mon Parcours" },
  { href: "/diagnostic", label: "Diagnostic" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="hidden w-64 flex-col gap-1 border-r border-dark/5 bg-white p-4 sm:flex">
      <p className="mb-4 px-2 text-lg font-extrabold text-navy">Virtuose Funnel</p>
      {ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            pathname === item.href ? "bg-royal/10 text-royal" : "text-secondary hover:bg-soft"
          }`}
        >
          {item.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={handleSignOut}
        className="mt-auto rounded-lg border-t border-dark/5 px-3 py-2 pt-4 text-left text-sm font-medium text-secondary hover:bg-soft"
      >
        Se déconnecter
      </button>
    </nav>
  );
}
