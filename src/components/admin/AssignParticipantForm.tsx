"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { ProfileForAssignment } from "@/lib/cohorts/types";

interface AssignParticipantFormProps {
  cohortId: string;
  availableParticipants: ProfileForAssignment[];
}

export function AssignParticipantForm({ cohortId, availableParticipants }: AssignParticipantFormProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId) {
      setError("Choisissez un participant.");
      return;
    }

    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("admin_assign_participant_cohort", {
      p_profile_id: selectedId,
      p_cohort_id: cohortId,
    });

    setSubmitting(false);

    if (rpcError) {
      setError("L'assignation a échoué. Réessayez dans un instant.");
      return;
    }

    setSelectedId("");
    router.refresh();
  }

  if (availableParticipants.length === 0) {
    return <p className="text-sm text-secondary">Tous les participants sont déjà assignés à une cohorte.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm text-dark">
        Participant
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="rounded-lg border border-dark/10 px-3 py-2 text-sm"
        >
          <option value="">Choisir...</option>
          {availableParticipants.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.business_name ?? profile.full_name ?? profile.id}
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
