import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth";

/**
 * API route to clear all authentication cookies and redirect to login page
 * Used primarily when a session exists for a user that has been deleted
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "unknown";
    const email = session?.user?.email || "unknown";

    // Check if this is a recent Google auth session
    const tokenData = (session as any)?.token || {};
    const isRecentGoogleAuth =
      tokenData.googleAuthTimestamp &&
      Date.now() - tokenData.googleAuthTimestamp < 15000; // 15 seconds

    // For very recent auth, don't show an error since it might be temporary
    const errorParam = isRecentGoogleAuth ? "" : "?error=UserDeleted";

    logger.info("Clearing session and authentication cookies", {
      userId,
      email,
      url: request.url,
      referer: request.headers.get("referer") || "none",
      isRecentGoogleAuth,
    });

    // List of auth cookies to clear
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

    // Create response that redirects to login
    const response = NextResponse.redirect(
      new URL(`/auth/login${errorParam}`, request.url)
    );

    // Clear all auth cookies
    for (const cookieName of authCookies) {
      response.cookies.delete(cookieName);

      // Also set an expired cookie to ensure it's removed
      response.cookies.set(cookieName, "", {
        expires: new Date(0),
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
      });
    }

    return response;
  } catch (error) {
    logger.error("Error clearing session cookies", {
      error: error instanceof Error ? error.message : String(error),
    });

    // Even if there's an error, attempt to clear cookies and redirect
    const response = NextResponse.redirect(
      new URL("/auth/login?error=SessionClearError", request.url)
    );

    // Try to clear at least the main auth cookie
    response.cookies.delete("next-auth.session-token");
    response.cookies.set("next-auth.session-token", "", {
      expires: new Date(0),
      path: "/",
    });

    return response;
  }
}
