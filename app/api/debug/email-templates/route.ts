import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG] Email templates debug endpoint called");

    // Check authentication
    const session = await auth();
    console.log("🔍 [DEBUG] Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      userId: session?.user?.id,
    });

    // Check admin session cookie
    const adminSessionCookie = request.cookies.get("admin-session");
    console.log("🔍 [DEBUG] Admin session cookie:", {
      hasCookie: !!adminSessionCookie,
      cookieValue: adminSessionCookie?.value ? "present" : "missing",
    });

    // Try to fetch templates directly
    console.log("🔍 [DEBUG] Attempting to fetch templates from database...");
    const templates = await prisma.emailTemplate.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        subject: true,
        category: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log("✅ [DEBUG] Templates fetched successfully:", templates.length);

    return NextResponse.json({
      success: true,
      debug: {
        session: {
          hasSession: !!session,
          hasUser: !!session?.user,
          userRole: session?.user?.role,
          userId: session?.user?.id,
        },
        adminCookie: {
          hasCookie: !!adminSessionCookie,
          cookieValue: adminSessionCookie?.value ? "present" : "missing",
        },
        database: {
          templatesCount: templates.length,
          connectionWorking: true,
        },
      },
      templates: templates,
    });
  } catch (error) {
    console.error("❌ [DEBUG] Error in debug endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        debug: {
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}
