import { NextResponse } from "next/server";

/**
 * Debug API route to help diagnose authentication configuration issues
 * Only available in development or when explicitly enabled
 */
export async function GET() {
  // Only allow in development or when explicitly enabled
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_AUTH_DEBUG !== "true"
  ) {
    return NextResponse.json(
      { error: "Debug endpoint not available in production" },
      { status: 404 }
    );
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
    };

    // Test database connection
    try {
      const { db } = await import("@/lib/db");
      await db.user.findFirst({ take: 1 });
      debugInfo.database = { status: "connected" };
    } catch (dbError) {
      debugInfo.database = {
        status: "error",
        error:
          dbError instanceof Error ? dbError.message : "Unknown database error",
      };
    }

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Debug endpoint failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
