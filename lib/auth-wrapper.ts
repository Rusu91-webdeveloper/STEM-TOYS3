/**
 * NextAuth wrapper with improved error handling for development
 */

import NextAuth, { NextAuthConfig } from "next-auth";

// Wrap NextAuth to handle configuration errors gracefully
export function createAuth(config: NextAuthConfig) {
  try {
    // Ensure required environment variables are set
    if (
      !process.env.NEXTAUTH_SECRET &&
      process.env.NODE_ENV !== "development"
    ) {
      throw new Error("NEXTAUTH_SECRET is required in production");
    }

    // Add default secret for development if not set
    const authConfig: NextAuthConfig = {
      ...config,
      secret:
        process.env.NEXTAUTH_SECRET ||
        (process.env.NODE_ENV === "development"
          ? "development-secret-please-change-in-production"
          : undefined),
      // Add trustHost for development
      trustHost: process.env.NODE_ENV === "development",
    };

    return NextAuth(authConfig);
  } catch (error) {
    console.error("Failed to initialize NextAuth:", error);

    // Return a minimal auth implementation for development
    if (process.env.NODE_ENV === "development") {
      console.warn("Using fallback auth implementation for development");

      // Return mock auth functions
      return {
        handlers: {
          GET: async (req: any) => new Response(
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
          POST: async (req: any) => new Response(
              JSON.stringify({
                error: "Auth not configured properly",
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            ),
        },
        auth: async () => null,
        signIn: async () => ({ error: "Auth not configured" }),
        signOut: async () => ({ error: "Auth not configured" }),
      };
    }

    throw error;
  }
}
