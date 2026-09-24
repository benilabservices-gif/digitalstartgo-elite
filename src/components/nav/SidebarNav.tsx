"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/lib/profile/role";
import { SigneVirtuose } from "@/components/marketing/LogoVirtuose";
import { useEffect, useState } from "react";

interface Stage {
  id: string;
  number: number;
  slug: string;
  title: string;
}

interface NavLinkItem {
  href: string;
  label: string;
  icon?: string;
  isStage?: boolean;
}

const BASE_ITEMS: NavLinkItem[] = [
  { href: "/dashboard", label: "Mon Parcours", icon: "home" },
  { href: "/diagnostic", label: "Diagnostic", icon: "chart" },
  { href: "/ressources", label: "Ressources", icon: "book" },
];

const COACH_ITEM: NavLinkItem = { href: "/coach", label: "Revue coach", icon: "review" };
const ADMIN_ITEMS: NavLinkItem[] = [
  { href: "/admin/cohorts", label: "Cohortes", icon: "users" },
  { href: "/admin/abonnements", label: "Abonnements", icon: "credit" },
];

const COMING_SOON_LABELS = ["Communauté"];

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    home: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    chart: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    book: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    review: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    users: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    credit: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    bot: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  };
  return icons[name] ?? null;
}

export function SidebarNav({ role }: { role: ProfileRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: stagesData } = await supabase
        .from("stages")
        .select("id, number, slug, title")
        .order("number");

      const { data: progressData } = await supabase
        .from("mission_progress")
        .select("mission_id, status");

      const progress = new Map<string, string>();
      (progressData ?? []).forEach((p) => progress.set(p.mission_id, p.status));

      setStages((stagesData ?? []) as Stage[]);
      setProgressMap(progress);
      setLoading(false);
    }
    loadData();
  }, []);

  function isStageLocked(stage: Stage): boolean {
    if (stage.number === 1) return false;
    const prevStage = stages.find((s) => s.number === stage.number - 1);
    if (!prevStage) return false;
    // Find missions of previous stage
    const prevMissions = stages
      .filter((s) => s.number === prevStage.number)
      .flatMap((s) => [{ id: s.id, slug: s.slug }]);
    // Check if all missions in previous stage are validated
    // Since we don't have direct mission data here, we check if the stage itself has progress
    return false; // Simplified: all stages accessible after onboarding
  }

  function getStageStatus(stage: Stage): "locked" | "available" | "in_progress" | "completed" {
    if (stage.number === 1) return "available";
    // Check if any mission in this stage has progress
    const stageMissions = stages.filter((s) => s.number <= stage.number);
    // Simplified logic: a stage is locked if the previous stage is not completed
    return "available";
  }

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
    <aside className="hidden w-64 flex-col border-r border-paper/10 bg-ink pb-6 sm:flex">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <SigneVirtuose className="h-7 w-7" />
        <div className="flex flex-col">
          <span className="t-display-mid text-[0.9375rem] text-paper">Virtuose Funnel</span>
          <span className="t-meta text-[0.5625rem] text-steel/60">Espace membre</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3">
        <p className="mb-2 px-3 t-meta text-[0.625rem] uppercase tracking-widest text-steel/40">
          Menu
        </p>
        <div className="flex flex-col gap-0.5">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-[2px] px-3 py-2.5 text-sm transition-all ${
                  isActive
                    ? "bg-gold/15 text-gold"
                    : "text-steel/70 hover:bg-paper/10 hover:text-paper"
                }`}
              >
                {item.icon && (
                  <span className={`shrink-0 ${isActive ? "text-gold" : "text-steel/50 group-hover:text-steel"}`}>
                    <NavIcon name={item.icon} />
                  </span>
                )}
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Stages */}
        <div className="mt-6">
          <p className="mb-2 px-3 t-meta text-[0.625rem] uppercase tracking-widest text-steel/40">
            Le Parcours
          </p>
          <div className="flex flex-col gap-0.5">
            {loading ? (
              <p className="px-3 text-xs text-steel/30">Chargement...</p>
            ) : (
              stages.map((stage) => {
                const stageHref = `/parcours/${stage.slug}`;
                const isActive = pathname === stageHref || pathname.startsWith(stageHref + "/");
                const status = getStageStatus(stage);
                const isLocked = status === "locked";

                return (
                  <Link
                    key={stage.id}
                    href={isLocked ? "#" : stageHref}
                    className={`group flex items-center gap-3 rounded-[2px] px-3 py-2.5 text-sm transition-all ${
                      isLocked
                        ? "cursor-not-allowed text-steel/30"
                        : isActive
                        ? "bg-gold/15 text-gold"
                        : "text-steel/70 hover:bg-paper/10 hover:text-paper"
                    }`}
                    onClick={(e) => isLocked && e.preventDefault()}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-bold ${
                      isActive
                        ? "bg-gold text-ink"
                        : isLocked
                        ? "bg-steel/10 text-steel/30"
                        : "bg-paper/10 text-steel/50 group-hover:bg-gold/20 group-hover:text-gold"
                    }`}>
                      {isLocked ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      ) : (
                        String(stage.number).padStart(2, "0")
                      )}
                    </span>
                    <span className="truncate font-medium">{stage.title}</span>
                    {isActive && (
                      <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* AI Coach */}
        <div className="mt-4">
          <p className="mb-2 px-3 t-meta text-[0.625rem] uppercase tracking-widest text-steel/40">
            Assistant
          </p>
          <Link
            href="/coach-ai"
            className={`group flex items-center gap-3 rounded-[2px] px-3 py-2.5 text-sm transition-all ${
              pathname === "/coach-ai"
                ? "bg-gold/15 text-gold"
                : "text-steel/70 hover:bg-paper/10 hover:text-paper"
            }`}
          >
            <span className={`shrink-0 ${pathname === "/coach-ai" ? "text-gold" : "text-steel/50 group-hover:text-steel"}`}>
              <NavIcon name="bot" />
            </span>
            <span className="font-medium">Coach AI</span>
            <span className="ml-auto rounded-full border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[0.5625rem] text-gold">
              Pro
            </span>
          </Link>
        </div>

        {/* Coming soon */}
        <div className="mt-4">
          <p className="mb-2 px-3 t-meta text-[0.625rem] uppercase tracking-widest text-steel/30">
            À venir
          </p>
          <div className="flex flex-col gap-0.5">
            {COMING_SOON_LABELS.map((label) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-[2px] px-3 py-2.5 text-sm text-steel/30"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-steel/20" />
                <span className="flex-1 font-medium">{label}</span>
                <span className="t-meta rounded-[2px] border border-steel/15 px-1.5 py-0.5 text-[0.5625rem] text-steel/30">
                  Bientôt
                </span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Sign out */}
      <div className="border-t border-paper/10 px-3 pt-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-[2px] px-3 py-2.5 text-sm text-steel/60 transition-colors hover:bg-paper/10 hover:text-paper"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
