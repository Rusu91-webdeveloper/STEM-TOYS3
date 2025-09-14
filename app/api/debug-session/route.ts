import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  console.log("🔍 [DEBUG-SESSION] Debug session request received");
  
  try {
    console.log("🔍 [DEBUG-SESSION] Getting NextAuth session...");
    const session = await auth();
    
    console.log("🔍 [DEBUG-SESSION] Session data:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      isAdmin: session?.user?.role === "ADMIN"
    });
    
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
    console.error("❌ [DEBUG-SESSION] Error getting session:", error);
    console.error("❌ [DEBUG-SESSION] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return NextResponse.json(
      {
        error: "Failed to get session",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
