"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ProfileRole } from "@/lib/profile/role";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { signOut } from "@/lib/auth/signout";

interface NavLinkItem {
  href: string;
  label: string;
  icon: string;
}

// Menu participant
const PARTICIPANT_ITEMS: NavLinkItem[] = [
  { href: "/dashboard", label: "Accueil", icon: "home" },
  { href: "/diagnostic", label: "Diagnostic", icon: "chart" },
  { href: "/ressources", label: "Ressources", icon: "book" },
];

// Menu coach
const COACH_ITEMS: NavLinkItem[] = [
  { href: "/coach", label: "Livrables", icon: "review" },
  { href: "/coach/participants", label: "Participants", icon: "users" },
];

// Menu admin — items principaux (barre du bas)
const ADMIN_MAIN_ITEMS: NavLinkItem[] = [
  { href: "/admin", label: "Dashboard", icon: "home" },
  { href: "/admin/membres", label: "Membres", icon: "users" },
  { href: "/admin/livrables", label: "Livrables", icon: "review" },
];

// Menu admin — items secondaires (panneau "Plus")
const ADMIN_MORE_ITEMS: NavLinkItem[] = [
  { href: "/admin/cohorts", label: "Cohortes", icon: "users" },
  { href: "/admin/abonnements", label: "Abonnements", icon: "credit" },
];

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
    users: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    credit: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    more: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
    ),
  };
  return icons[name] ?? null;
}

interface MorePanelProps {
  isOpen: boolean;
  onClose: () => void;
  role: ProfileRole;
}

function MorePanel({ isOpen, onClose, role }: MorePanelProps) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  // Fermer en cliquant en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Items secondaires selon le rôle
  const moreItems: NavLinkItem[] = role === "admin" ? ADMIN_MORE_ITEMS : [];

  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:hidden" onClick={onClose}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full bg-ink border-t border-paper/20 px-6 pb-safe pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex max-w-md flex-col gap-3 pb-4">
          {/* Handle */}
          <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-paper/30" />

          {/* More links */}
          {moreItems.map((item) => {
            const isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-[2px] px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? "bg-gold/15 text-gold"
                    : "text-steel/70 hover:bg-paper/10 hover:text-paper"
                }`}
              >
                <NavIcon name={item.icon} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Divider */}
          {moreItems.length > 0 && (
            <div className="border-t border-paper/10" />
          )}

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-[2px] px-4 py-3 text-sm text-error hover:bg-error/10"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Se déconnecter</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function BottomNav({ role }: { role: ProfileRole }) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Déterminer les items du menu selon le rôle
  let items: NavLinkItem[] = [];
  if (role === "admin") {
    items = ADMIN_MAIN_ITEMS;
  } else if (role === "coach") {
    items = COACH_ITEMS;
  } else {
    // participant ou null
    items = PARTICIPANT_ITEMS;
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center border-t border-paper/20 bg-ink/95 backdrop-blur-lg sm:hidden">
        <div className="flex flex-1 items-stretch">
          {items.map((item) => {
            const isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors ${
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
        </div>

        {/* Bouton Plus */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-steel/60 transition-colors hover:text-paper"
          aria-label="Plus d'options"
        >
          <NavIcon name="more" />
          <span className="text-[0.625rem] font-medium">Plus</span>
        </button>

        <NotificationBell />
      </nav>

      <MorePanel isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} role={role} />
    </>
  );
}
