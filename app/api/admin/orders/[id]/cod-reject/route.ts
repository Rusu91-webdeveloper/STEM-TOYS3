import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { markCODOrderAsRejected } from "@/lib/analytics/cod-analytics";

/**
 * POST /api/admin/orders/[id]/cod-reject
 * Mark a COD order as rejected
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const params = await context.params;
    const orderId = params.id;
    const { reason, notes } = await request.json();

    if (!reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    await markCODOrderAsRejected(orderId, reason, notes);

    return NextResponse.json({
      success: true,
      message: "COD order marked as rejected",
    });
  } catch (error) {
    console.error("Error marking COD order as rejected:", error);
    return NextResponse.json(
      {
        error: "Failed to mark COD order as rejected",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
