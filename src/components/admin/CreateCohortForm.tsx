"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CreateCohortForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim() || !startsAt || !endsAt) {
      setError("Nom, date de début et date de fin sont obligatoires.");
      return;
    }
    if (endsAt < startsAt) {
      setError("La date de fin doit être après la date de début.");
      return;
    }

    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("cohorts").insert({
      name: name.trim(),
      slug: `${slugify(name)}-${startsAt}`,
      starts_at: startsAt,
      ends_at: endsAt,
    });

    setSubmitting(false);

    if (insertError) {
      setError("La cohorte n'a pas pu être créée. Réessayez dans un instant.");
      return;
    }

    setName("");
    setStartsAt("");
    setEndsAt("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm text-dark">
        Nom
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Cohorte Septembre 2026"
          className="rounded-lg border border-dark/10 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-dark">
        Début
        <input
          type="date"
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          className="rounded-lg border border-dark/10 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-dark">
        Fin
        <input
          type="date"
          value={endsAt}
          onChange={(event) => setEndsAt(event.target.value)}
          className="rounded-lg border border-dark/10 px-3 py-2 text-sm"
        />
      </label>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Création..." : "Créer la cohorte"}
      </Button>
      {error && <p className="w-full text-sm text-error">{error}</p>}
    </form>
  );
}
