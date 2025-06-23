// This file configures the initialization of Sentry on the server side
// The config you add here will be used whenever the server handles a request
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",
  
  // Only run Sentry in production and preview environments
  enabled: process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "preview",
  
  // Environment
  environment: process.env.NODE_ENV || "development",
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,
  
  // Enhanced error reporting for server
  beforeSend: (event, hint) => {
    // Filter out certain errors in development
    if (process.env.NODE_ENV === "development") {
      return event;
    }
    
    // Add server context
    if (event.contexts) {
      event.contexts.server = {
        name: "stem-toys-ecommerce",
        version: process.env.npm_package_version || "1.0.0",
      };
    }
    
    // Sanitize sensitive data
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers["x-api-key"];
      }
      
      // Remove sensitive query parameters
      if (typeof event.request.query_string === "string") {
        event.request.query_string = event.request.query_string
          .replace(/([?&])(token|key|secret|password)=[^&]*/gi, "$1$2=[REDACTED]");
      }
    }
    
    return event;
  },
  
  // Session tracking (server-side)
  autoSessionTracking: false, // Disable for server-side
  
  // Performance monitoring
  enableTracing: process.env.NODE_ENV === "production",
  
  // Server-specific integrations
  integrations: [
    // HTTP integration for tracking HTTP requests
    // Database integration can be added here if needed
  ],
  
  // Performance tracing for server
  tracePropagationTargets: [
    "localhost",
    /^\/api/,
    ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : []),
  ],
  
  // Additional server options
  initialScope: {
    tags: {
      component: "server",
      environment: process.env.NODE_ENV,
    },
  },
  
  // Error filtering for server
  ignoreErrors: [
    // Ignore common non-actionable errors
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    "ChunkLoadError",
    // Network errors that aren't actionable
    "NetworkError",
    "fetch failed",
  ],
  
  // Sampling for performance monitoring
  tracesSampler: (samplingContext) => {
    // High priority routes get higher sampling
    const pathname = samplingContext.location?.pathname;
    
    if (pathname?.startsWith("/api/")) {
      // API routes - important for monitoring
      return process.env.NODE_ENV === "production" ? 0.2 : 1.0;
    }
    
    if (pathname?.startsWith("/checkout") || pathname?.startsWith("/payment")) {
      // Critical user flows - highest sampling
      return process.env.NODE_ENV === "production" ? 0.5 : 1.0;
    }
    
    // Default sampling rate
    return process.env.NODE_ENV === "production" ? 0.1 : 1.0;
  },
}); 