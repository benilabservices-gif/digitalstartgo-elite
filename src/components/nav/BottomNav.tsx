"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ProfileRole } from "@/lib/profile/role";

interface NavLinkItem {
  href: string;
  label: string;
}

const BASE_ITEMS: NavLinkItem[] = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/diagnostic", label: "Diagnostic" },
];

const COACH_ITEM: NavLinkItem = { href: "/coach", label: "Coach" };

export function BottomNav({ role }: { role: ProfileRole }) {
  const pathname = usePathname();
  const items = role === "coach" ? [...BASE_ITEMS, COACH_ITEM] : BASE_ITEMS;

  return (
    <nav className="fixed inset-x-0 bottom-0 flex border-t border-dark/5 bg-white sm:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex-1 py-3 text-center text-xs font-medium ${
            pathname === item.href ? "text-ochre" : "text-secondary"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
