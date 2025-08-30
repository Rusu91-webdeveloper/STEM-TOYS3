import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({
        valid: false,
        reason: "No session found",
      });
    }

    // Check if the user still exists in the database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      console.warn(
        `Session validation failed: User ${session.user.id} not found in database`
      );
      return NextResponse.json({
        valid: false,
        reason: "User not found in database",
      });
    }

    if (!user.isActive) {
      console.warn(`Session validation failed: User ${user.email} is inactive`);
      return NextResponse.json({
        valid: false,
        reason: "User account is inactive",
      });
    }

    // Session is valid
    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json({
      valid: false,
      reason: "Validation error",
    });
  }
}
