import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";

/**
 * API route to clear invalid sessions and auth cookies
 * This helps users who are stuck in an invalid authentication state
 */
export function GET(request: NextRequest) {
  try {
    logger.info("Clearing invalid session and auth cookies");

    const response = NextResponse.redirect(new URL("/", request.url));

    // Clear all NextAuth cookies
    const authCookies = [
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "next-auth.csrf-token",
      "__Secure-next-auth.csrf-token",
      "next-auth.callback-url",
      "__Secure-next-auth.callback-url",
      "next-auth.pkce.code_verifier",
      "__Host-next-auth.csrf-token",
    ];

    authCookies.forEach(cookieName => {
      // Clear with different path combinations
      response.cookies.set(cookieName, "", {
        expires: new Date(0),
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
      });

      response.cookies.set(cookieName, "", {
        expires: new Date(0),
        path: "/auth",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
      });
    });

    // Add headers to clear client-side session data
    response.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"');
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );

    logger.info("Session and cookies cleared successfully");
    return response;
  } catch (error) {
    logger.error("Error clearing session", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to clear session",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export function POST(request: NextRequest) {
  // Support both GET and POST for different use cases
  return GET(request);
}
