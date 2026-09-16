import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  MISSION_STATUS_LABELS,
  MISSION_STATUS_TONE,
  toMissionStatus,
} from "@/lib/missions/status";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, onboarding_completed, role")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const { data: stages } = await supabase
    .from("stages")
    .select("id, number, title, missions(id, number, title)")
    .order("order_index");

  const { data: progressRows } = await supabase
    .from("mission_progress")
    .select("mission_id, status")
    .eq("profile_id", user.id);

  const progressByMission = new Map((progressRows ?? []).map((row) => [row.mission_id, row.status]));

  const allMissions = (stages ?? []).flatMap((stage) => stage.missions);
  const validatedCount = allMissions.filter(
    (mission) => progressByMission.get(mission.id) === "valide"
  ).length;
  const overallProgress = allMissions.length > 0 ? (validatedCount / allMissions.length) * 100 : 0;

  const currentStage = (stages ?? []).find((stage) =>
    stage.missions.some((mission) => progressByMission.get(mission.id) !== "valide")
  );
  const currentMission = currentStage?.missions[0];
  const currentStatus = currentMission
    ? toMissionStatus(progressByMission.get(currentMission.id))
    : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-extrabold text-dark">
        Bonjour {profile.business_name ?? ""} 👋
      </h1>
      <p className="mb-8 text-secondary">Voici ce qui compte aujourd&apos;hui.</p>

      {profile.role === "coach" && (
        <div className="mb-6">
          <Card title="Espace coach">
            <p className="mb-3 text-secondary">
              Vous avez des livrables de participants à revoir.
            </p>
            <Link href="/coach" className="text-sm font-semibold text-royal hover:underline">
              Ouvrir la file de revue →
            </Link>
          </Card>
        </div>
      )}

      <Card title="Progression globale">
        <ProgressBar value={overallProgress} label="Mon Parcours Virtuose" />
      </Card>

      {currentMission && currentStatus && (
        <div className="mt-6">
          <Card title={`Mission ${currentMission.number}`}>
            <p className="mb-4 text-dark">{currentMission.title}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Badge tone={MISSION_STATUS_TONE[currentStatus]}>
                {MISSION_STATUS_LABELS[currentStatus]}
              </Badge>
              <Link
                href={`/missions/${currentMission.id}`}
                className="text-sm font-semibold text-royal hover:underline"
              >
                Ouvrir la mission →
              </Link>
            </div>
          </Card>
        </div>
      )}

      <div className="mt-6">
        <Card title="Progression par étape">
          <ol className="flex flex-col gap-3">
            {(stages ?? []).map((stage) => {
              const stageMission = stage.missions[0];
              const status = toMissionStatus(
                stageMission ? progressByMission.get(stageMission.id) : undefined
              );
              const label = (
                <span className="text-dark">
                  {String(stage.number).padStart(2, "0")} {stage.title}
                </span>
              );
              return (
                <li key={stage.id} className="flex items-center justify-between gap-3">
                  {stageMission ? (
                    <Link href={`/missions/${stageMission.id}`} className="hover:underline">
                      {label}
                    </Link>
                  ) : (
                    label
                  )}
                  <Badge tone={MISSION_STATUS_TONE[status]}>{MISSION_STATUS_LABELS[status]}</Badge>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </div>
  );
}
