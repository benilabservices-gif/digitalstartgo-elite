import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { groupResourcesByStage } from "@/lib/resources/group";
import type { ResourceRow, StageWithNumber } from "@/lib/resources/types";

export default async function ResourcesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: stages } = await supabase
    .from("stages")
    .select("id, number, title")
    .order("order_index");

  const { data: resources } = await supabase
    .from("resources")
    .select("id, stage_id, slug, title, description, type, content_blocks, external_url, order_index")
    .order("order_index");

  const groups = groupResourcesByStage(
    (resources ?? []) as ResourceRow[],
    (stages ?? []) as StageWithNumber[]
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="t-display-mid text-3xl text-dark">Ressources</h1>
      <p className="mb-8 text-secondary">
        Guides pratiques et liens utiles pour chaque étape de votre parcours.
      </p>

      {groups.map((group) => (
        <div key={group.stageId ?? "general"} className="mb-8">
          <p className="t-meta mb-3 text-xs uppercase tracking-widest text-secondary">
            {group.stageLabel}
          </p>
          <Card>
            <ol className="flex flex-col gap-4">
              {group.resources.map((resource) => (
                <li
                  key={resource.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-dark/5 pb-4 last:border-none last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-dark">{resource.title}</p>
                    <p className="text-sm text-secondary">{resource.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="default">{resource.type === "guide" ? "Guide" : "Lien"}</Badge>
                    {resource.type === "guide" ? (
                      <Link
                        href={`/ressources/${resource.slug}`}
                        className="text-sm font-semibold text-ochre hover:underline"
                      >
                        Ouvrir →
                      </Link>
                    ) : (
                      <a
                        href={resource.external_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-ochre hover:underline"
                      >
                        Ouvrir →
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      ))}
    </div>
  );
}
