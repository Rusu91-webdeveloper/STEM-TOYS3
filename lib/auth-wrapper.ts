/**
 * NextAuth wrapper with improved error handling for development
 */

import NextAuth, { NextAuthConfig } from "next-auth";

// Wrap NextAuth to handle configuration errors gracefully
export function createAuth(config: NextAuthConfig) {
  try {
    // Log configuration attempt for debugging
    console.warn("Creating NextAuth instance with config:", {
      providersCount: config.providers?.length ?? 0,
      hasSecret: !!config.secret,
      hasCallbacks: !!config.callbacks,
      NODE_ENV: process.env.NODE_ENV,
    });

    // Ensure required environment variables are set
    if (
      !process.env.NEXTAUTH_SECRET &&
      process.env.NODE_ENV !== "development"
    ) {
      throw new Error("NEXTAUTH_SECRET is required in production");
    }

    // Verify database connectivity is possible
    if (!process.env.DATABASE_URL) {
      console.error(
        "DATABASE_URL is missing - this will cause authentication failures"
      );
    }

    // Determine the correct URL for NextAuth
    let nextAuthUrl = process.env.NEXTAUTH_URL;
    if (!nextAuthUrl) {
      if (process.env.VERCEL_URL) {
        nextAuthUrl = `https://${process.env.VERCEL_URL}`;
      } else if (process.env.NODE_ENV === "production") {
        nextAuthUrl = "https://stem-toys-3.vercel.app";
      } else {
        nextAuthUrl = "http://localhost:3000";
      }
      // Set the environment variable for NextAuth to use
      process.env.NEXTAUTH_URL = nextAuthUrl;
    }

    console.warn("NextAuth URL set to:", nextAuthUrl);

    // Add default secret for development if not set
    const authConfig: NextAuthConfig = {
      ...config,
      secret:
        process.env.NEXTAUTH_SECRET ??
        (process.env.NODE_ENV === "development"
          ? "development-secret-please-change-in-production"
          : undefined),
      // Add trustHost for development
      trustHost: process.env.NODE_ENV === "development",
    };

    console.warn("NextAuth configuration validated successfully");
    return NextAuth(authConfig);
  } catch (error) {
    console.error("Failed to initialize NextAuth:", error);

    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
          hasNEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
          hasDATABASE_URL: !!process.env.DATABASE_URL,
          VERCEL_URL: process.env.VERCEL_URL,
        },
      });
    }

    // Return a minimal auth implementation for development
    if (process.env.NODE_ENV === "development") {
      console.warn("Using fallback auth implementation for development");

      // Return mock auth functions
      return {
        handlers: {
          GET: (_req: Request) =>
            new Response(
              JSON.stringify({
                user: null,
                expires: new Date(
                  Date.now() + 24 * 60 * 60 * 1000
                ).toISOString(),
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            ),
          POST: (_req: Request) =>
            new Response(
              JSON.stringify({
                error:
                  "Auth not configured properly - check your environment variables",
                details: {
                  hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
                  hasNEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
                  hasDATABASE_URL: !!process.env.DATABASE_URL,
                },
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            ),
        },
        auth: () => null,
        signIn: () => ({ error: "Auth not configured" }),
        signOut: () => ({ error: "Auth not configured" }),
      };
    }

    throw error;
  }
}
