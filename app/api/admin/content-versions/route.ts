import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentVersioningService } from "@/lib/services/content-versioning";

// GET /api/admin/content-versions - Get version history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("contentId");
    const contentType = searchParams.get("contentType") as
      | "BLOG"
      | "PRODUCT"
      | "CATEGORY";

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: "contentId and contentType are required" },
        { status: 400 }
      );
    }

    const history = await contentVersioningService.getVersionHistory(
      contentId,
      contentType
    );

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching content versions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/content-versions - Create new version
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contentId, contentType, content, changeDescription } = body;

    if (!contentId || !contentType || !content) {
      return NextResponse.json(
        { error: "contentId, contentType, and content are required" },
        { status: 400 }
      );
    }

    const version = await contentVersioningService.createVersion({
      contentId,
      contentType,
      content,
      changeDescription,
      createdBy: session.user.id,
      isPublished: content.isPublished || false,
    });

    return NextResponse.json(version);
  } catch (error) {
    console.error("Error creating content version:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
