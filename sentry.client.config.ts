// This file configures the initialization of Sentry on the browser side
// The config you add here will be used whenever a page is visited
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  // Only run Sentry in production and custom staging environments
  enabled:
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "preview",

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

  // Enhanced error reporting
  beforeSend: (event, hint) => {
    // Filter out certain errors in development
    if (process.env.NODE_ENV === "development") {
      // Skip ChunkLoadError and similar development-only errors
      if (event.exception?.values?.[0]?.value?.includes("ChunkLoadError")) {
        return null;
      }
    }

    // Add additional context
    if (event.user) {
      // Remove sensitive user data
      delete event.user.email;
      delete event.user.ip_address;
    }

    return event;
  },

  // Session tracking
  autoSessionTracking: true,

  // Performance monitoring
  enableTracing: process.env.NODE_ENV === "production",

  // Integrations - using standard integrations from @sentry/nextjs
  integrations: [
    // Performance monitoring is automatically included in @sentry/nextjs
  ],

  // Performance tracing options
  tracePropagationTargets: [
    "localhost",
    /^\/api/,
    ...(process.env.NEXT_PUBLIC_SITE_URL
      ? [process.env.NEXT_PUBLIC_SITE_URL]
      : []),
  ],

  // Additional options
  initialScope: {
    tags: {
      component: "client",
      environment: process.env.NODE_ENV,
    },
  },
});
