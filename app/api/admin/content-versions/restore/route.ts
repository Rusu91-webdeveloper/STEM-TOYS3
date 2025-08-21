import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { contentVersioningService } from "@/lib/services/content-versioning";
import { resolveAdminUserId } from "@/lib/admin-utils";

// POST /api/admin/content-versions/restore - Restore to specific version
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contentId, contentType, version, changeDescription } = body;

    if (!contentId || !contentType || typeof version !== "number") {
      return NextResponse.json(
        { error: "contentId, contentType, and version are required" },
        { status: 400 }
      );
    }

    // Resolve the actual admin user ID (handles admin_env case)
    const createdByUserId = await resolveAdminUserId(
      session.user.id,
      session.user.email
    );

    const restoredVersion = await contentVersioningService.restoreToVersion(
      contentId,
      contentType,
      version,
      createdByUserId,
      changeDescription
    );

    return NextResponse.json({
      success: true,
      version: restoredVersion,
      message: `Content restored to version ${version}`,
    });
  } catch (error) {
    console.error("Error restoring content version:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
