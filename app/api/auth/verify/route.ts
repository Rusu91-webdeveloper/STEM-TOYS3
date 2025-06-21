import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

// Handle the email verification request
async function handleVerify(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/error?error=missing_token", request.url)
    );
  }

  try {
    // Find the user with this verification token
    const user = await db.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/auth/error?error=invalid_token", request.url)
      );
    }

    // Update the user to mark as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        isActive: true,
      },
    });

    // Redirect to login page with success message
    return NextResponse.redirect(
      new URL("/auth/login?verified=true", request.url)
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?error=server_error", request.url)
    );
  }
}

// Apply rate limiting to the verify endpoint
// Limit to 5 requests per IP address per 5 minutes
export const GET = withRateLimit(handleVerify, {
  limit: 5,
  windowMs: 5 * 60 * 1000, // 5 minutes
});
