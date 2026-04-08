import { db } from "@/lib/db";

const appendOrderNote = (
  currentNotes: string | null | undefined,
  nextNote: string
) => [currentNotes, nextNote].filter(Boolean).join(" | ");

export async function compensateFailedOrder(input: {
  orderId: string;
  reason: string;
  paymentIntentId?: string | null;
  source: "stripe_capture_failed" | "netopia_payment_creation_failed";
}) {
  const failureTimestamp = new Date().toISOString();
  const financeReviewReason =
    input.source === "stripe_capture_failed"
      ? "Stripe capture failed after order creation. Manual finance review required."
      : "Netopia payment initiation failed after order creation. Manual finance review required.";
  const failureNote =
    input.source === "stripe_capture_failed"
      ? `Stripe capture failed at ${failureTimestamp} - PI: ${input.paymentIntentId || "N/A"} - ${input.reason}`
      : `Netopia payment initiation failed at ${failureTimestamp} - ${input.reason}`;

  await db.$transaction(async tx => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: {
        items: {
          select: {
            productId: true,
            quantity: true,
            isDigital: true,
          },
        },
      },
    });

    if (!order) {
      return;
    }

    if (
      order.paymentStatus === "FAILED" &&
      order.status === "CANCELLED" &&
      order.notes?.includes(failureNote)
    ) {
      return;
    }

    for (const item of order.items) {
      if (!item.productId || item.isDigital === true) {
        continue;
      }

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
          reservedQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    const couponUsages = await tx.couponUsage.findMany({
      where: { orderId: input.orderId },
      select: {
        couponId: true,
      },
    });

    if (couponUsages.length > 0) {
      await tx.couponUsage.deleteMany({
        where: { orderId: input.orderId },
      });

      const usageCounts = couponUsages.reduce<Map<string, number>>(
        (acc, usage) => {
          acc.set(usage.couponId, (acc.get(usage.couponId) || 0) + 1);
          return acc;
        },
        new Map()
      );

      for (const [couponId, count] of usageCounts.entries()) {
        await tx.coupon.update({
          where: { id: couponId },
          data: {
            currentUses: {
              decrement: count,
            },
          },
        });
      }
    }

    await tx.order.update({
      where: { id: input.orderId },
      data: {
        paymentStatus: "FAILED",
        status: "CANCELLED",
        manualShippingReviewRequired: true,
        shippingReviewReason: financeReviewReason,
        netopiaPaymentUrl:
          input.source === "netopia_payment_creation_failed" ? null : undefined,
        netopiaInvoiceId:
          input.source === "netopia_payment_creation_failed" ? null : undefined,
        netopiaTransactionId:
          input.source === "netopia_payment_creation_failed" ? null : undefined,
        notes: appendOrderNote(order.notes, failureNote),
      },
    });
  });
}
