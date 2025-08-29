import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const sp = request.nextUrl.searchParams;
    const page = parseInt(sp.get("page") || "1");
    const limit = parseInt(sp.get("limit") || "10");
    const type = sp.get("type") || "";
    const activeOnly = sp.get("activeOnly") === "true";

    const now = new Date();

    const where: any = {};
    if (type) where.type = type;
    if (activeOnly) {
      where.isActive = true;
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];
      where.publishedAt = { lte: now };
    }

    // Target filtering (ALL or contains supplier.id)
    where.OR = [
      { targetSuppliers: { has: "ALL" } },
      { targetSuppliers: { has: supplier.id } },
    ];

    const [announcements, total] = await Promise.all([
      db.supplierAnnouncement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          priority: true,
          isActive: true,
          publishedAt: true,
          expiresAt: true,
        },
      }),
      db.supplierAnnouncement.count({ where }),
    ]);

    return NextResponse.json({
      announcements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching supplier announcements:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
