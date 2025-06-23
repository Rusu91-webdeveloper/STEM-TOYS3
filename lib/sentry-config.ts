/**
 * Sentry configuration with worker thread safety
 */

export const sentryConfig = {
  // Disable Sentry in development if causing issues
  enabled: process.env.NODE_ENV === "production" && !!process.env.SENTRY_DSN,

  // Basic configuration
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",

  // Disable features that might cause worker thread issues
  integrations: (integrations: any[]) => {
    // Filter out problematic integrations in development
    if (process.env.NODE_ENV !== "production") {
      return integrations.filter(integration => {
        const name = integration.name || integration.constructor.name;
        // Remove OpenTelemetry and other worker-based integrations
        return (
          !name.includes("OpenTelemetry") &&
          !name.includes("Worker") &&
          !name.includes("Thread")
        );
      });
    }
    return integrations;
  },

  // Disable tracing in development to avoid issues
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  // Disable profiling which uses workers
  profilesSampleRate: 0,

  // Before send hook to prevent sensitive data leaks
  beforeSend(event: any, hint: any) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV !== "production" && !process.env.FORCE_SENTRY) {
      return null;
    }

    // Filter out noisy errors
    if (hint.originalException?.message) {
      const message = hint.originalException.message;
      const ignoredErrors = [
        "worker thread exited",
        "Cannot find module",
        "MODULE_NOT_FOUND",
      ];

      if (ignoredErrors.some(error => message.includes(error))) {
        return null;
      }
    }

    return event;
  },
};
