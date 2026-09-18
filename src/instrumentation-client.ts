import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Volume faible pour l'instant : projet sans trafic réel, pas besoin
  // d'échantillonner en dessous de 100% des transactions.
  tracesSampleRate: 1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
