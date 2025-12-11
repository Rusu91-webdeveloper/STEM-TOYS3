import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// GET: list feeds, optionally filter by supplierId
// POST: create feed
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const supplierId = searchParams.get("supplierId") || undefined;
    const feeds = await db.supplierFeed.findMany({
      where: { ...(supplierId ? { supplierId } : {}) },
      orderBy: { createdAt: "desc" },
      include: {
        supplier: {
          select: { id: true, companyName: true, name: true, email: true, status: true },
        },
      },
    });

    return NextResponse.json({ feeds });
  } catch (error) {
    logger.error("Admin supplier feeds list error", { error });
    return NextResponse.json(
      { error: "Failed to load supplier feeds" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      supplierId,
      name,
      type,
      sourceUrl,
      authType = "NONE",
      apiKey,
      authHeader,
      username,
      password,
      headers,
      mapping,
      pollingIntervalMinutes = 60,
      isActive = true,
    } = body || {};

    if (!supplierId || !type) {
      return NextResponse.json(
        { error: "supplierId and type are required" },
        { status: 400 }
      );
    }

    // Basic safety: ensure supplier exists
    const supplier = await db.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const feed = await db.supplierFeed.create({
      data: {
        supplierId,
        name,
        type,
        sourceUrl,
        authType,
        apiKey,
        authHeader,
        username,
        password,
        headers: headers ?? {},
        mapping: mapping ?? {},
        pollingIntervalMinutes,
        isActive,
      },
    });

    return NextResponse.json({ feed }, { status: 201 });
  } catch (error) {
    logger.error("Admin supplier feed create error", { error });
    return NextResponse.json(
      { error: "Failed to create supplier feed" },
      { status: 500 }
    );
  }
}
