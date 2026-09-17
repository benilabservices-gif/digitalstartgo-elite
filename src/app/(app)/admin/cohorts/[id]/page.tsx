import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/cohorts/admin";
import { Card } from "@/components/ui/Card";
import { AssignParticipantForm } from "@/components/admin/AssignParticipantForm";
import { AssignCoachForm } from "@/components/admin/AssignCoachForm";
import type { ProfileForAssignment } from "@/lib/cohorts/types";

export default async function AdminCohortDetailPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin();

  const { data: cohort } = await supabase
    .from("cohorts")
    .select("id, name, starts_at, ends_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!cohort) {
    notFound();
  }

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
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin/cohorts" className="text-sm font-medium text-ochre hover:underline">
        ← Toutes les cohortes
      </Link>
      <h1 className="t-display-mid mt-4 text-3xl text-dark">{cohort.name}</h1>
      <p className="mb-8 text-secondary">
        Du {cohort.starts_at} au {cohort.ends_at}
      </p>

      <Card title="Participants">
        <ul className="mb-4 flex flex-col gap-2">
          {assignedParticipants.length === 0 ? (
            <li className="text-sm text-secondary">Aucun participant assigné.</li>
          ) : (
            assignedParticipants.map((profile) => (
              <li key={profile.id} className="text-sm text-dark">
                {profile.business_name ?? profile.full_name ?? profile.id}
              </li>
            ))
          )}
        </ul>
        <AssignParticipantForm cohortId={cohort.id} availableParticipants={availableParticipants} />
      </Card>

      <div className="mt-6">
        <Card title="Coachs">
          <ul className="mb-4 flex flex-col gap-2">
            {assignedCoaches.length === 0 ? (
              <li className="text-sm text-secondary">Aucun coach assigné.</li>
            ) : (
              assignedCoaches.map((profile) => (
                <li key={profile.id} className="text-sm text-dark">
                  {profile.full_name ?? profile.business_name ?? profile.id}
                </li>
              ))
            )}
          </ul>
          <AssignCoachForm cohortId={cohort.id} availableCoaches={availableCoaches} />
        </Card>
      </div>
    </div>
  );
}
