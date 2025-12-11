import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { runSupplierFeedSync } from "@/lib/suppliers/sync";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const feed = await db.supplierFeed.findUnique({ where: { id: params.id } });
    if (!feed) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    const result = await runSupplierFeedSync({ feedId: params.id });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    logger.error("Admin supplier feed sync error", { error });
    return NextResponse.json(
      { error: "Failed to trigger supplier feed sync" },
      { status: 500 }
    );
  }
}
