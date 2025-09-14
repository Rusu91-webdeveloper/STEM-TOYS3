import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    return NextResponse.json({
      session: session,
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      isAdmin: session?.user?.role === "ADMIN",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get session",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
