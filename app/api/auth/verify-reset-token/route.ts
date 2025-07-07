import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

// Handle the verify reset token request
async function handleVerifyResetToken(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    // Check if the token exists and is valid
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ valid: false, reason: "token_not_found" });
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      return NextResponse.json({ valid: false, reason: "token_expired" });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Error verifying reset token:", error);
    return NextResponse.json(
      { valid: false, reason: "server_error" },
      { status: 500 }
    );
  }
}

// Apply rate limiting to the verify reset token endpoint
// Limit to 5 requests per IP address per 5 minutes
export const GET = withRateLimit(handleVerifyResetToken, {
  limit: 5,
  windowMs: 5 * 60 * 1000, // 5 minutes
});
