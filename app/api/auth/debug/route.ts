import { NextResponse } from "next/server";

/**
 * Debug API route to help diagnose authentication configuration issues
 * Only available in development or when explicitly enabled
 */
export async function GET() {
  // Allow in production for debugging auth issues
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_AUTH_DEBUG !== "true"
  ) {
    // For production debugging, we'll allow it but with limited info
    const limitedInfo = {
      timestamp: new Date().toISOString(),
      message:
        "Add ENABLE_AUTH_DEBUG=true to environment variables for full debug info",
      environment: process.env.NODE_ENV,
      hasNEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      hasGOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      hasGOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    };
    return NextResponse.json(limitedInfo, { status: 200 });
  }

  try {
    const debugInfo: {
      timestamp: string;
      environment: {
        NODE_ENV: string;
        VERCEL_URL: string | undefined;
        isVercel: boolean;
      };
      environmentVariables: {
        hasNEXTAUTH_URL: boolean;
        NEXTAUTH_URL: string | undefined;
        hasNEXTAUTH_SECRET: boolean;
        NEXTAUTH_SECRET_LENGTH: number;
        hasDATABASE_URL: boolean;
        DATABASE_URL_START: string;
        hasGOOGLE_CLIENT_ID: boolean;
        hasGOOGLE_CLIENT_SECRET: boolean;
      };
      nextAuthConfig: {
        expectedCallbackUrl: string;
        authApiRoute: string;
      };
      googleOAuthUrls: {
        expectedRedirectUri: string;
        testAuthUrl: string;
      };
      recommendations: string[];
      database?: {
        status: string;
        error?: string;
      };
    } = {
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
      recommendations: [],
    };

    // Generate recommendations based on the configuration
    if (!debugInfo.environmentVariables.hasNEXTAUTH_URL) {
      debugInfo.recommendations.push(
        "🔴 CRITICAL: NEXTAUTH_URL is missing. Add it to your Vercel environment variables."
      );
    }

    if (!debugInfo.environmentVariables.hasNEXTAUTH_SECRET) {
      debugInfo.recommendations.push(
        "🔴 CRITICAL: NEXTAUTH_SECRET is missing. Add a secure secret to your environment variables."
      );
    } else if (debugInfo.environmentVariables.NEXTAUTH_SECRET_LENGTH < 32) {
      debugInfo.recommendations.push(
        "⚠️ WARNING: NEXTAUTH_SECRET should be at least 32 characters long."
      );
    }

    if (
      !debugInfo.environmentVariables.hasGOOGLE_CLIENT_ID ||
      !debugInfo.environmentVariables.hasGOOGLE_CLIENT_SECRET
    ) {
      debugInfo.recommendations.push(
        "🔴 CRITICAL: Google OAuth credentials are missing. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
      );
    }

    if (!debugInfo.environmentVariables.hasDATABASE_URL) {
      debugInfo.recommendations.push(
        "🔴 CRITICAL: DATABASE_URL is missing. Add your database connection string."
      );
    }

    if (
      debugInfo.environment.isVercel &&
      !debugInfo.environmentVariables.NEXTAUTH_URL
    ) {
      debugInfo.recommendations.push(
        `🔧 ACTION: Set NEXTAUTH_URL to https://${debugInfo.environment.VERCEL_URL || "your-domain.vercel.app"} in Vercel environment variables.`
      );
    }

    if (debugInfo.environmentVariables.hasGOOGLE_CLIENT_ID) {
      debugInfo.recommendations.push(
        `🔧 ACTION: Ensure ${debugInfo.googleOAuthUrls.expectedRedirectUri} is added to your Google OAuth redirect URIs.`
      );
    }

    // Test database connection
    try {
      const { db } = await import("@/lib/db");
      await db.user.findFirst({ take: 1 });
      debugInfo.database = { status: "connected" };
      debugInfo.recommendations.push("✅ Database connection is working.");
    } catch (dbError) {
      debugInfo.database = {
        status: "error",
        error:
          dbError instanceof Error ? dbError.message : "Unknown database error",
      };
      debugInfo.recommendations.push(
        `🔴 DATABASE ERROR: ${dbError instanceof Error ? dbError.message : "Unknown database error"}`
      );
    }

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Debug endpoint failed",
        details: error instanceof Error ? error.message : "Unknown error",
        recommendations: [
          "🔴 CRITICAL: Debug endpoint failed. Check server logs for more details.",
        ],
      },
      { status: 500 }
    );
  }
}
