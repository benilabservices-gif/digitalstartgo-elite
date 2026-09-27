import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { peutTelechargerRessource } from "@/lib/resources/access";

// Téléchargement d'un fichier de la bibliothèque : vérifie l'abonnement, puis
// redirige vers un lien signé valable 2 minutes (le bucket est privé).
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const origin = new URL(request.url).origin;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const [{ data: profile }, { data: abonnement }, { data: ressource }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("expires_at")
      .eq("profile_id", user.id)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("resources")
      .select("type, file_path")
      .eq("slug", params.slug)
      .maybeSingle(),
  ]);

  if (!peutTelechargerRessource(profile?.role, abonnement?.expires_at)) {
    return NextResponse.redirect(`${origin}/abonnement`);
  }

  if (!ressource || ressource.type !== "fichier" || !ressource.file_path) {
    return NextResponse.json({ error: "Ressource introuvable." }, { status: 404 });
  }

  const nomFichier = ressource.file_path.split("/").pop() ?? "ressource.pdf";
  const { data, error } = await createServiceClient()
    .storage.from("ressources")
    .createSignedUrl(ressource.file_path, 120, { download: nomFichier });

  if (error || !data?.signedUrl) {
    console.error("[ressources/fichier] lien signé impossible :", error?.message);
    return NextResponse.json({ error: "Fichier indisponible pour le moment." }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
