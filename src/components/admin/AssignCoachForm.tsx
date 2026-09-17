"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { ProfileForAssignment } from "@/lib/cohorts/types";

interface AssignCoachFormProps {
  cohortId: string;
  availableCoaches: ProfileForAssignment[];
}

export function AssignCoachForm({ cohortId, availableCoaches }: AssignCoachFormProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId) {
      setError("Choisissez un coach.");
      return;
    }

    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("cohort_coaches")
      .insert({ cohort_id: cohortId, coach_id: selectedId });

    setSubmitting(false);

    if (insertError) {
      setError("L'assignation a échoué. Réessayez dans un instant.");
      return;
    }

    setSelectedId("");
    router.refresh();
  }

  if (availableCoaches.length === 0) {
    return <p className="text-sm text-secondary">Tous les coachs sont déjà assignés à cette cohorte.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm text-dark">
        Coach
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="rounded-lg border border-dark/10 px-3 py-2 text-sm"
        >
          <option value="">Choisir...</option>
          {availableCoaches.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name ?? profile.business_name ?? profile.id}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Assignation..." : "Assigner à cette cohorte"}
      </Button>
      {error && <p className="w-full text-sm text-error">{error}</p>}
    </form>
  );
}
