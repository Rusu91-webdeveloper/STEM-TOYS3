import { NextResponse } from "next/server";

export async function GET() {
  const debugInfo: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      isVercel: !!process.env.VERCEL,
    },
    environmentVariables: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length ?? 0,
      DATABASE_URL: `${process.env.DATABASE_URL?.substring(0, 50)}...`,
      hasGOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      hasGOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_CLIENT_ID_PREFIX: `${process.env.GOOGLE_CLIENT_ID?.substring(0, 20)}...`,
    },
    authCreationTest: {},
    databaseTest: {},
    providersTest: {},
  };

  // Test 1: Basic environment validation
  try {
    if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "production") {
      debugInfo.authCreationTest.secretValidation =
        "FAIL: NEXTAUTH_SECRET missing in production";
    } else {
      debugInfo.authCreationTest.secretValidation = "PASS";
    }

    if (!process.env.DATABASE_URL) {
      debugInfo.authCreationTest.databaseUrlValidation =
        "FAIL: DATABASE_URL missing";
    } else {
      debugInfo.authCreationTest.databaseUrlValidation = "PASS";
    }

    // Test URL determination
    let nextAuthUrl = process.env.NEXTAUTH_URL;
    if (!nextAuthUrl) {
      if (process.env.VERCEL_URL) {
        nextAuthUrl = `https://${process.env.VERCEL_URL}`;
      } else if (process.env.NODE_ENV === "production") {
        nextAuthUrl = "https://stem-toys-3.vercel.app";
      } else {
        nextAuthUrl = "http://localhost:3000";
      }
    }
    debugInfo.authCreationTest.urlDetermination = {
      result: nextAuthUrl,
      source: process.env.NEXTAUTH_URL ? "env" : "computed",
    };
  } catch (error) {
    debugInfo.authCreationTest.error =
      error instanceof Error ? error.message : String(error);
  }

  // Test 2: Database connection
  try {
    const { db } = await import("@/lib/db");
    await db.$connect();
    debugInfo.databaseTest.connection = "PASS: Connected successfully";
    await db.$disconnect();
  } catch (error) {
    debugInfo.databaseTest.connection = `FAIL: ${error instanceof Error ? error.message : String(error)}`;
  }

  // Test 3: Providers configuration
  try {
    const hasGoogleCreds = !!(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    );
    debugInfo.providersTest.googleCredsPresent = hasGoogleCreds;

    if (hasGoogleCreds) {
      // Try to create a Google provider
      const GoogleProvider = (await import("next-auth/providers/google"))
        .default;
      const googleProvider = GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      });
      debugInfo.providersTest.googleProviderCreation = "PASS";
      debugInfo.providersTest.googleProviderId = googleProvider.id;
    } else {
      debugInfo.providersTest.googleProviderCreation =
        "SKIP: No Google credentials";
    }
  } catch (error) {
    debugInfo.providersTest.error =
      error instanceof Error ? error.message : String(error);
  }

  // Test 4: Try to create minimal NextAuth config
  try {
    const NextAuth = (await import("next-auth")).default;

    const minimalConfig = {
      providers: [],
      secret: process.env.NEXTAUTH_SECRET ?? "test-secret",
      trustHost: true,
    };

    // Try to create NextAuth instance
    NextAuth(minimalConfig);
    debugInfo.authCreationTest.minimalConfigTest = "PASS: Minimal config works";
  } catch (error) {
    debugInfo.authCreationTest.minimalConfigTest = `FAIL: ${error instanceof Error ? error.message : String(error)}`;
  }

  // Test 5: Try to create the actual auth config
  try {
    // Import the actual auth config
    const { authOptions } = await import("@/lib/server/auth");
    debugInfo.authCreationTest.configImport = "PASS: Auth options imported";

    // Check providers count
    debugInfo.authCreationTest.providersCount =
      authOptions.providers?.length ?? 0;
  } catch (error) {
    debugInfo.authCreationTest.configImport = `FAIL: ${error instanceof Error ? error.message : String(error)}`;
  }

  // Test 6: Try to create the auth wrapper
  try {
    const { createAuth } = await import("@/lib/auth-wrapper");
    const { authOptions } = await import("@/lib/server/auth");

    const authInstance = createAuth(authOptions);
    debugInfo.authCreationTest.wrapperTest = "PASS: Auth wrapper works";

    // Test if handlers exist
    if (authInstance.handlers) {
      debugInfo.authCreationTest.handlersExist = "PASS";
    } else {
      debugInfo.authCreationTest.handlersExist = "FAIL: No handlers";
    }
  } catch (error) {
    debugInfo.authCreationTest.wrapperTest = `FAIL: ${error instanceof Error ? error.message : String(error)}`;
    if (error instanceof Error && error.stack) {
      debugInfo.authCreationTest.wrapperStack = error.stack
        .split("\n")
        .slice(0, 10);
    }
  }

  return NextResponse.json(debugInfo, { status: 200 });
}
