import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { Badge } from "@/components/ui/Badge";
import { groupResourcesByStage } from "@/lib/resources/group";
import type { ResourceRow, StageWithNumber } from "@/lib/resources/types";
import { ExternalLink, FileText, Download } from "lucide-react";

export default async function ResourcesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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
    <div className="mx-auto max-w-3xl px-6 py-10 pb-24 sm:pb-10">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ochre hover:underline">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour au dashboard
      </Link>

      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">Bibliothèque</p>
        <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">Ressources</h1>
        <p className="mt-2 text-secondary">
          Guides pratiques et liens utiles pour chaque étape de votre parcours.
        </p>
      </div>

      {groups.map((group) => (
        <div key={group.stageId ?? "general"} className="mb-8">
          <p className="mb-3 t-meta text-xs uppercase tracking-widest text-secondary">
            {group.stageLabel}
          </p>
          <PremiumCard>
            <ol className="space-y-3">
              {group.resources.map((resource) => (
                <li
                  key={resource.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[2px] border border-dark/6 px-4 py-3 transition-colors hover:border-ochre/25 hover:bg-paper/40"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] ${
                      resource.type === "guide" ? "bg-gold/15" : "bg-ink/5"
                    }`}>
                      {resource.type === "guide" ? (
                        <FileText className="h-4 w-4 text-ochre" />
                      ) : (
                        <ExternalLink className="h-4 w-4 text-secondary" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-dark">{resource.title}</p>
                      <p className="text-sm text-secondary">{resource.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="default">{resource.type === "guide" ? "Guide" : "Lien"}</Badge>
                    {resource.type === "guide" ? (
                      <Link
                        href={`/ressources/${resource.slug}`}
                        className="flex items-center gap-1.5 rounded-[2px] bg-gold px-3 py-1.5 text-sm font-semibold text-ink transition-all hover:bg-amber hover:shadow-[0_0_12px_rgba(240,185,40,0.3)]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Ouvrir
                      </Link>
                    ) : (
                      <a
                        href={resource.external_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm font-semibold text-ochre hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ouvrir
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </PremiumCard>
        </div>
      ))}
    </div>
  );
}
