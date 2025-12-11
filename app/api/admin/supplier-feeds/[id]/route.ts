import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const feed = await db.supplierFeed.findUnique({
      where: { id: params.id },
      include: { supplier: true },
    });

    if (!feed) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    return NextResponse.json({ feed });
  } catch (error) {
    logger.error("Admin supplier feed fetch error", { error });
    return NextResponse.json({ error: "Failed to load feed" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      type,
      sourceUrl,
      authType,
      apiKey,
      authHeader,
      username,
      password,
      headers,
      mapping,
      pollingIntervalMinutes,
      isActive,
    } = body || {};

    const existing = await db.supplierFeed.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    const feed = await db.supplierFeed.update({
      where: { id: params.id },
      data: {
        name,
        type,
        sourceUrl,
        authType,
        apiKey,
        authHeader,
        username,
        password,
        headers: headers ?? existing.headers ?? {},
        mapping: mapping ?? existing.mapping ?? {},
        pollingIntervalMinutes:
          typeof pollingIntervalMinutes === "number"
            ? pollingIntervalMinutes
            : existing.pollingIntervalMinutes,
        isActive: typeof isActive === "boolean" ? isActive : existing.isActive,
      },
    });

    return NextResponse.json({ feed });
  } catch (error) {
    logger.error("Admin supplier feed update error", { error });
    return NextResponse.json(
      { error: "Failed to update supplier feed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await db.supplierFeed.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Admin supplier feed delete error", { error });
    return NextResponse.json(
      { error: "Failed to delete supplier feed" },
      { status: 500 }
    );
  }
}
