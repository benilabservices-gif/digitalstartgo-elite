import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profile");

  if (!profileId) {
    return NextResponse.json({ error: "Missing profile parameter" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("profiles")
    .update({ rappels_email: false })
    .eq("id", profileId);

  if (error) {
    console.error("[email/unsubscribe] error:", error.message);
    return NextResponse.json({ error: "Erreur lors de la désinscription" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
