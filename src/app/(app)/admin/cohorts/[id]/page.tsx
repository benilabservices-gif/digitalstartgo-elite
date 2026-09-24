import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/cohorts/admin";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { AssignParticipantForm } from "@/components/admin/AssignParticipantForm";
import { AssignCoachForm } from "@/components/admin/AssignCoachForm";
import type { ProfileForAssignment } from "@/lib/cohorts/types";
import { Users, UserPlus, ArrowLeft } from "lucide-react";

export default async function AdminCohortDetailPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin();

  const { data: cohort } = await supabase
    .from("cohorts")
    .select("id, name, starts_at, ends_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!cohort) notFound();

  const { data: profilesData } = await supabase.rpc("admin_list_profiles");
  const profiles = (profilesData ?? []) as ProfileForAssignment[];

  const { data: cohortCoachesData } = await supabase
    .from("cohort_coaches")
    .select("coach_id")
    .eq("cohort_id", cohort.id);
  const assignedCoachIds = new Set((cohortCoachesData ?? []).map((row) => row.coach_id as string));

  const assignedParticipants = profiles.filter(
    (profile) => profile.role === "participant" && profile.cohort_id === cohort.id
  );
  const availableParticipants = profiles.filter(
    (profile) => profile.role === "participant" && profile.cohort_id === null
  );
  const assignedCoaches = profiles.filter((profile) => profile.role === "coach" && assignedCoachIds.has(profile.id));
  const availableCoaches = profiles.filter(
    (profile) => profile.role === "coach" && !assignedCoachIds.has(profile.id)
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 pb-24 sm:pb-10">
      <Link href="/admin/cohorts" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ochre hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Toutes les cohortes
      </Link>

      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">Détails de la cohorte</p>
        <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">{cohort.name}</h1>
        <p className="mt-2 text-secondary">
          Du {cohort.starts_at} au {cohort.ends_at}
        </p>
      </div>

      {/* Participants */}
      <PremiumCard
        title={`Participants · ${assignedParticipants.length}`}
        subtitle={assignedParticipants.length === 0 ? "Aucun participant assigné." : `${availableParticipants.length} disponible(s) à ajouter.`}
        className="mb-6"
      >
        {assignedParticipants.length > 0 && (
          <ul className="mb-5 space-y-2">
            {assignedParticipants.map((profile) => (
              <li key={profile.id} className="flex items-center gap-3 rounded-[2px] border border-dark/6 px-3 py-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[0.625rem] font-bold text-paper">
                  {(profile.business_name ?? profile.full_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-dark">
                  {profile.business_name ?? profile.full_name ?? profile.id}
                </span>
              </li>
            ))}
          </ul>
        )}
        {availableParticipants.length > 0 && (
          <AssignParticipantForm cohortId={cohort.id} availableParticipants={availableParticipants} />
        )}
      </PremiumCard>

      {/* Coachs */}
      <PremiumCard
        title={`Coachs · ${assignedCoaches.length}`}
        subtitle={assignedCoaches.length === 0 ? "Aucun coach assigné." : `${availableCoaches.length} disponible(s) à ajouter.`}
      >
        {assignedCoaches.length > 0 && (
          <ul className="mb-5 space-y-2">
            {assignedCoaches.map((profile) => (
              <li key={profile.id} className="flex items-center gap-3 rounded-[2px] border border-dark/6 px-3 py-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[0.625rem] font-bold text-ochre">
                  {(profile.business_name ?? profile.full_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-dark">
                  {profile.full_name ?? profile.business_name ?? profile.id}
                </span>
              </li>
            ))}
          </ul>
        )}
        {availableCoaches.length > 0 && (
          <AssignCoachForm cohortId={cohort.id} availableCoaches={availableCoaches} />
        )}
      </PremiumCard>
    </div>
  );
}
