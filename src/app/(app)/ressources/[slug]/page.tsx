import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/resources/PrintButton";
import type { ResourceBlock } from "@/lib/resources/types";

export default async function ResourceDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: resource } = await supabase
    .from("resources")
    .select("title, description, type, content_blocks")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!resource || resource.type !== "guide") {
    notFound();
  }

  const blocks = (resource.content_blocks ?? []) as ResourceBlock[];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/ressources"
        className="text-sm font-medium text-ochre hover:underline print:hidden"
      >
        ← Toutes les ressources
      </Link>
      <h1 className="t-display-mid mt-4 text-3xl text-dark">{resource.title}</h1>
      <p className="mb-8 text-secondary">{resource.description}</p>

      <div className="flex flex-col gap-4">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h2 key={index} className="t-display-mid mt-4 text-xl text-dark">
                {block.text}
              </h2>
            );
          }
          if (block.type === "list") {
            return (
              <ul key={index} className="flex flex-col gap-2">
                {(block.items ?? []).map((item, itemIndex) => (
                  <li key={itemIndex} className="border-l-2 border-ochre/40 pl-3 text-dark">
                    {item}
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={index} className="text-dark">
              {block.text}
            </p>
          );
        })}
      </div>

      <div className="mt-10 print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
