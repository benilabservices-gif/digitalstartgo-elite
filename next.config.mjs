import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  // N'affiche les logs d'upload de source maps qu'en CI, pas en dev local.
  silent: !process.env.CI,
});
