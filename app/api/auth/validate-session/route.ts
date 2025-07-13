import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

/**
 * Session validation endpoint
 * Checks if the current session is valid and returns user information
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          valid: false,
          reason: "No session found",
        },
        { status: 200 }
      );
    }

    // Additional validation - check if user exists and is active
    if (!session.user.id) {
      return NextResponse.json(
        {
          valid: false,
          reason: "Invalid session - missing user ID",
        },
        { status: 200 }
      );
    }

    // Check if user is active
    if (session.user.isActive === false) {
      return NextResponse.json(
        {
          valid: false,
          reason: "User account is inactive",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        isActive: session.user.isActive,
      },
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      {
        valid: false,
        reason: "Session validation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}
