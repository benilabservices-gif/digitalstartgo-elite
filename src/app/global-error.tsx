"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-dark">Une erreur est survenue</h1>
          <p className="mt-2 text-secondary">
            L&apos;équipe a été prévenue automatiquement. Réessayez dans un instant.
          </p>
        </div>
      </body>
    </html>
  );
}
