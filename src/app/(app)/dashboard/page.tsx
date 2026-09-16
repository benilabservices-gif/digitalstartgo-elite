import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

const STATUS_LABELS: Record<string, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  soumis: "Soumis",
  a_corriger: "À corriger",
  valide: "Validé",
};

const STATUS_TONE: Record<string, "default" | "success" | "warning"> = {
  a_faire: "default",
  en_cours: "warning",
  soumis: "warning",
  a_corriger: "warning",
  valide: "success",
};

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
    .select("business_name, onboarding_completed")
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-extrabold text-dark">
        Bonjour {profile.business_name ?? ""} 👋
      </h1>
      <p className="mb-8 text-secondary">Voici ce qui compte aujourd&apos;hui.</p>

      <Card title="Progression globale">
        <ProgressBar value={overallProgress} label="Mon Parcours Virtuose" />
      </Card>

      {currentMission && (
        <div className="mt-6">
          <Card title={`Mission ${currentMission.number}`}>
            <p className="mb-4 text-dark">{currentMission.title}</p>
            <Badge tone={STATUS_TONE[progressByMission.get(currentMission.id) ?? "a_faire"]}>
              {STATUS_LABELS[progressByMission.get(currentMission.id) ?? "a_faire"]}
            </Badge>
          </Card>
        </div>
      )}

      <div className="mt-6">
        <Card title="Progression par étape">
          <ol className="flex flex-col gap-3">
            {(stages ?? []).map((stage) => {
              const stageMission = stage.missions[0];
              const status = stageMission ? progressByMission.get(stageMission.id) ?? "a_faire" : "a_faire";
              return (
                <li key={stage.id} className="flex items-center justify-between">
                  <span className="text-dark">
                    {String(stage.number).padStart(2, "0")} {stage.title}
                  </span>
                  <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </div>
  );
}
