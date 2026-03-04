import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  formatCodGuaranteeCaptureNote,
  parseCodGuaranteeEvidence,
} from "@/lib/checkout/cod-guarantee";
import { db } from "@/lib/db";
import { getStripeServerClient } from "@/lib/stripe-server";
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
    const orderIdOrNumber = params.id;
    const { reason, notes, captureGuarantee } = await request.json();

    if (!reason) {
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

    const shouldCaptureGuarantee = captureGuarantee !== false;
    const codGuaranteeEvidence = parseCodGuaranteeEvidence(order.notes);
    let guaranteeCaptured = false;
    let guaranteeCaptureAmount: number | null = null;
    const processingNotes: string[] = [];

    if (
      shouldCaptureGuarantee &&
      codGuaranteeEvidence.authorizedPaymentIntentId
    ) {
      try {
        const stripe = getStripeServerClient();
        const paymentIntentId = codGuaranteeEvidence.authorizedPaymentIntentId;
        const paymentIntent =
          await stripe.paymentIntents.retrieve(paymentIntentId);
        const authorizedAmountMinor = Math.round(
          Math.max(0, codGuaranteeEvidence.authorizedAmount || 0) * 100
        );

        if (
          paymentIntent.status === "requires_capture" &&
          paymentIntent.amount_capturable > 0 &&
          authorizedAmountMinor > 0
        ) {
          const captureAmountMinor = Math.min(
            authorizedAmountMinor,
            paymentIntent.amount_capturable
          );
          const captureResult = await stripe.paymentIntents.capture(
            paymentIntentId,
            {
              amount_to_capture: captureAmountMinor,
            }
          );

          if (captureResult.status === "succeeded") {
            guaranteeCaptured = true;
            guaranteeCaptureAmount = captureAmountMinor / 100;
            processingNotes.push(
              formatCodGuaranteeCaptureNote({
                capturedAt: new Date().toISOString(),
                paymentIntentId,
                amount: guaranteeCaptureAmount,
              })
            );
          } else {
            processingNotes.push(
              `COD Guarantee capture attempted but returned status: ${captureResult.status}`
            );
          }
        } else if (paymentIntent.status === "succeeded") {
          guaranteeCaptured = true;
          guaranteeCaptureAmount =
            codGuaranteeEvidence.authorizedAmount ??
            Math.round(paymentIntent.amount / 100);
          processingNotes.push(
            `COD Guarantee already captured (PI: ${paymentIntentId})`
          );
        } else {
          processingNotes.push(
            `COD Guarantee not capturable (status: ${paymentIntent.status}, capturable: ${paymentIntent.amount_capturable})`
          );
        }
      } catch (captureError) {
        processingNotes.push(
          `COD Guarantee capture failed: ${
            captureError instanceof Error
              ? captureError.message
              : "Unknown capture error"
          }`
        );
      }
    } else if (shouldCaptureGuarantee) {
      processingNotes.push("COD Guarantee evidence not found on order notes.");
    }

    await markCODOrderAsRejected(
      order.id,
      reason,
      [notes, ...processingNotes].filter(Boolean).join(" | ") || undefined
    );

    return NextResponse.json({
      success: true,
      message: "COD order marked as rejected",
      guaranteeCaptured,
      guaranteeCaptureAmount,
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
