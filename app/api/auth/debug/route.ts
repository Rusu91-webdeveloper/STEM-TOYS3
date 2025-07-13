import { NextResponse } from "next/server";

/**
 * Debug API route to help diagnose authentication configuration issues
 * Only available in development or when explicitly enabled
 */
export async function GET() {
  // Create base response structure that's always consistent
  const baseResponse = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV ?? "development",
      VERCEL_URL: process.env.VERCEL_URL,
      isVercel: !!process.env.VERCEL,
    },
    environmentVariables: {
      hasNEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length ?? 0,
      hasDATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_START: `${process.env.DATABASE_URL?.substring(0, 20) ?? ""}...`,
      hasGOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      hasGOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    },
    nextAuthConfig: {
      expectedCallbackUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/auth/callback/google`,
      authApiRoute: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/auth/[...nextauth]`,
    },
    googleOAuthUrls: {
      expectedRedirectUri: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/auth/callback/google`,
      testAuthUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/auth/signin`,
    },
    recommendations: [] as string[],
    database: undefined as { status: string; error?: string } | undefined,
  };

  // Check if we should provide full debug info
  const isFullDebugMode =
    process.env.NODE_ENV === "development" ||
    process.env.ENABLE_AUTH_DEBUG === "true";

  if (!isFullDebugMode) {
    // For production debugging, provide basic info with a message
    baseResponse.recommendations.push(
      "ℹ️ Add ENABLE_AUTH_DEBUG=true to environment variables for full debug info"
    );
  }

  try {
    // Generate recommendations based on the configuration
    if (!baseResponse.environmentVariables.hasNEXTAUTH_URL) {
      baseResponse.recommendations.push(
        "🔴 CRITICAL: NEXTAUTH_URL is missing. Add it to your Vercel environment variables."
      );
    }

    if (!baseResponse.environmentVariables.hasNEXTAUTH_SECRET) {
      baseResponse.recommendations.push(
        "🔴 CRITICAL: NEXTAUTH_SECRET is missing. Add a secure secret to your environment variables."
      );
    } else if (baseResponse.environmentVariables.NEXTAUTH_SECRET_LENGTH < 32) {
      baseResponse.recommendations.push(
        "⚠️ WARNING: NEXTAUTH_SECRET should be at least 32 characters long."
      );
    }

    if (
      !baseResponse.environmentVariables.hasGOOGLE_CLIENT_ID ||
      !baseResponse.environmentVariables.hasGOOGLE_CLIENT_SECRET
    ) {
      baseResponse.recommendations.push(
        "🔴 CRITICAL: Google OAuth credentials are missing. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
      );
    }

    if (!baseResponse.environmentVariables.hasDATABASE_URL) {
      baseResponse.recommendations.push(
        "🔴 CRITICAL: DATABASE_URL is missing. Add your database connection string."
      );
    }

    if (
      baseResponse.environment.isVercel &&
      !baseResponse.environmentVariables.NEXTAUTH_URL
    ) {
      baseResponse.recommendations.push(
        `🔧 ACTION: Set NEXTAUTH_URL to https://${baseResponse.environment.VERCEL_URL || "your-domain.vercel.app"} in Vercel environment variables.`
      );
    }

    if (baseResponse.environmentVariables.hasGOOGLE_CLIENT_ID) {
      baseResponse.recommendations.push(
        `🔧 ACTION: Ensure ${baseResponse.googleOAuthUrls.expectedRedirectUri} is added to your Google OAuth redirect URIs.`
      );
    }

    // Test database connection only in full debug mode
    if (isFullDebugMode) {
      try {
        const { db } = await import("@/lib/db");
        await db.user.findFirst({ take: 1 });
        baseResponse.database = { status: "connected" };
        baseResponse.recommendations.push("✅ Database connection is working.");
      } catch (dbError) {
        baseResponse.database = {
          status: "error",
          error:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
        };
        baseResponse.recommendations.push(
          `🔴 DATABASE ERROR: ${dbError instanceof Error ? dbError.message : "Unknown database error"}`
        );
      }
    } else {
      // In limited mode, just check if DATABASE_URL is configured
      if (baseResponse.environmentVariables.hasDATABASE_URL) {
        baseResponse.database = { status: "configured" };
        baseResponse.recommendations.push(
          "ℹ️ Database URL is configured (connection not tested in limited mode)."
        );
      }
    }

    return NextResponse.json(baseResponse, { status: 200 });
  } catch (error) {
    console.error("Debug endpoint error:", error);

    // Return a safe fallback response with consistent structure
    const errorResponse = {
      ...baseResponse,
      recommendations: [
        "🔴 CRITICAL: Debug endpoint failed. Check server logs for more details.",
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
      database: {
        status: "error",
        error: "Failed to test database connection",
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
