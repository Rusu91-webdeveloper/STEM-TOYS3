import { NextRequest, NextResponse } from "next/server";

import { markCODOrderAsRejected } from "@/lib/analytics/cod-analytics";
import { auth } from "@/lib/auth";
import { validateCsrfForRequest } from "@/lib/csrf";
import { db } from "@/lib/db";

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

    if (!(await validateCsrfForRequest(request)).valid) {
      return NextResponse.json(
        { error: "Security validation failed" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const orderIdOrNumber = params.id;
    const { reason, notes, captureGuarantee } = await request.json();

    if (
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.length > 1000 ||
      (notes !== null && notes !== undefined && (typeof notes !== "string" || notes.length > 4000))
    ) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const order = await db.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
      },
      select: {
        id: true,
        paymentMethod: true,
        notes: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      order.paymentMethod !== "cash_on_delivery" &&
      order.paymentMethod !== "cod"
    ) {
      return NextResponse.json(
        { error: "Order is not COD. Rejection flow not applicable." },
        { status: 400 }
      );
    }

    // Recording RTO is not a legal determination of liability. No payment
    // provider is called here, including for legacy clients requesting capture.
    if (captureGuarantee === true) {
      return NextResponse.json(
        {
          error:
            "Refuzul/nepreluarea nu autorizează automat încasarea garanției. Înregistrează RTO fără încasare; orice prejudiciu necesită analiză juridică și dovezi separate.",
        },
        { status: 400 }
      );
    }
    const processingNotes = [
      "RTO recorded without guarantee capture. Check withdrawal declarations and seller/courier fault before assessing any loss.",
    ];

    await markCODOrderAsRejected(
      order.id,
      reason.trim(),
      [notes, ...processingNotes].filter(Boolean).join(" | ") || undefined
    );

    return NextResponse.json({
      success: true,
      message: "COD order marked as rejected",
      guaranteeCaptured: false,
      guaranteeCaptureAmount: null,
      details: processingNotes,
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
