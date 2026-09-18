"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface GrantSubscriptionButtonProps {
  profileId: string;
}

export function GrantSubscriptionButton({ profileId }: GrantSubscriptionButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("admin_grant_subscription", {
      p_profile_id: profileId,
      p_plan: "pro",
      p_days: 30,
    });

    setSubmitting(false);

    if (rpcError) {
      setError("L'octroi a échoué. Réessayez dans un instant.");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <Button type="button" onClick={handleClick} disabled={submitting}>
        {submitting ? "Octroi..." : "Accorder un accès de test (30 jours, Pro)"}
      </Button>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
