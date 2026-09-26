import Link from "next/link";
import { requireAdmin } from "@/lib/cohorts/admin";
import { PremiumCard, StatBadge } from "@/components/app-ui/PremiumCard";
import { Users, CheckCircle2, Clock, UserCog } from "lucide-react";

interface MemberRow {
  id: string;
  email: string;
  full_name: string | null;
  business_name: string | null;
  role: string;
  cohort_id: string | null;
  subscription_active: boolean;
}

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();

  // Utiliser admin_list_members() pour avoir tous les membres avec leurs rôles
  const { data: membersData } = await supabase.rpc("admin_list_members");
  const members = (membersData ?? []) as MemberRow[];

  // Calculer les statistiques
  const inscritsCount = members.length;
  const coachsCount = members.filter((m) => m.role === "coach").length;
  const abonnesCount = members.filter((m) => m.role === "participant" && m.subscription_active).length;

  // Compter les livrables en attente
  const { count: enAttenteCount } = await supabase
    .from("mission_submissions")
    .select("*", { count: "exact", head: true })
    .eq("statut", "soumis");

  const stats = [
    {
      label: "Inscrits",
      value: inscritsCount,
      icon: Users,
      color: "text-blue-500",
      href: "/admin/membres",
    },
    {
      label: "Abonnés actifs",
      value: abonnesCount,
      icon: CheckCircle2,
      color: "text-green-500",
      href: "/admin/abonnements",
    },
    {
      label: "Livrables en attente",
      value: enAttenteCount ?? 0,
      icon: Clock,
      color: "text-ochre",
      href: "/admin/livrables",
    },
    {
      label: "Coachs",
      value: coachsCount,
      icon: UserCog,
      color: "text-purple-500",
      href: "/admin/membres",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 pb-24 sm:pb-10">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">Administration</p>
        <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">Vue d&apos;ensemble</h1>
        <p className="mt-2 text-secondary">
          Supervisez l&apos;ensemble de la plateforme et gérez les comptes.
        </p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="block rounded-[2px] border border-dark/10 bg-white p-4 transition-all hover:border-ochre/30 hover:shadow-lg"
            >
              <div className={`mb-2 ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="t-chiffre text-2xl text-dark">{stat.value}</p>
              <p className="mt-1 text-xs text-secondary">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Actions rapides */}
      <PremiumCard title="Actions rapides">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/admin/membres"
            className="flex items-center gap-3 rounded-[2px] border border-dark/10 px-4 py-3 transition-colors hover:border-ochre/30 hover:bg-paper/40"
          >
            <Users className="h-5 w-5 text-ochre" />
            <div>
              <p className="font-medium text-dark">Gérer les membres</p>
              <p className="text-xs text-secondary">Voir et modifier tous les comptes</p>
            </div>
          </Link>
          <Link
            href="/admin/livrables"
            className="flex items-center gap-3 rounded-[2px] border border-dark/10 px-4 py-3 transition-colors hover:border-ochre/30 hover:bg-paper/40"
          >
            <Clock className="h-5 w-5 text-ochre" />
            <div>
              <p className="font-medium text-dark">Revue des livrables</p>
              <p className="text-xs text-secondary">Valider ou rejeter les soumissions</p>
            </div>
          </Link>
          <Link
            href="/admin/cohorts"
            className="flex items-center gap-3 rounded-[2px] border border-dark/10 px-4 py-3 transition-colors hover:border-ochre/30 hover:bg-paper/40"
          >
            <UserCog className="h-5 w-5 text-ochre" />
            <div>
              <p className="font-medium text-dark">Gérer les cohortes</p>
              <p className="text-xs text-secondary">Créer et organiser les cohortes</p>
            </div>
          </Link>
          <Link
            href="/admin/abonnements"
            className="flex items-center gap-3 rounded-[2px] border border-dark/10 px-4 py-3 transition-colors hover:border-ochre/30 hover:bg-paper/40"
          >
            <CheckCircle2 className="h-5 w-5 text-ochre" />
            <div>
              <p className="font-medium text-dark">Abonnements</p>
              <p className="text-xs text-secondary">Gérer les accès et abonnements</p>
            </div>
          </Link>
        </div>
      </PremiumCard>
    </div>
  );
}
