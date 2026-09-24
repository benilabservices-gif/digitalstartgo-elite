"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ProfileRole } from "@/lib/profile/role";
import { SigneVirtuose } from "@/components/marketing/LogoVirtuose";

interface NavLinkItem {
  href: string;
  label: string;
  icon: string;
}

const BASE_ITEMS: NavLinkItem[] = [
  { href: "/dashboard", label: "Accueil", icon: "home" },
  { href: "/diagnostic", label: "Diagnostic", icon: "chart" },
  { href: "/ressources", label: "Ressources", icon: "book" },
];

const COACH_ITEM: NavLinkItem = { href: "/coach", label: "Revue", icon: "review" };
const AI_COACH_ITEM: NavLinkItem = { href: "/coach-ai", label: "AI Coach", icon: "bot" };

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    home: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    chart: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    book: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    review: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    bot: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  };
  return icons[name] ?? null;
}

export function BottomNav({ role }: { role: ProfileRole }) {
  const pathname = usePathname();
  const items = [
    ...BASE_ITEMS,
    ...(role === "coach" ? [COACH_ITEM] : []),
    AI_COACH_ITEM,
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-paper/20 bg-ink/95 backdrop-blur-lg sm:hidden">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
              isActive ? "text-gold" : "text-steel/60"
            }`}
          >
            <NavIcon name={item.icon} />
            <span className="text-[0.625rem] font-medium">{item.label}</span>
            {isActive && (
              <span aria-hidden="true" className="mt-0.5 h-0.5 w-6 rounded-full bg-gold" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
