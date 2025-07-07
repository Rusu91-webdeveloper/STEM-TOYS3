import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sessionRateLimit } from "@/lib/rate-limit-session";

export async function GET(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    // Apply session-specific rate limiting (higher limits)
    const { success, remaining, reset } = await sessionRateLimit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Too many session requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": new Date(reset).toISOString(),
            "Retry-After": "5",
          },
        }
      );
    }

    // BYPASS CACHE: Always fetch session directly
    const session = await auth();
    if (!session) {
      return NextResponse.json({ user: null, expires: null });
    }
    return NextResponse.json(session);
  } catch (error) {
    console.error("Session error:", error);
    // Return a valid empty session instead of an error
    return NextResponse.json({ user: null, expires: null });
  }
}
