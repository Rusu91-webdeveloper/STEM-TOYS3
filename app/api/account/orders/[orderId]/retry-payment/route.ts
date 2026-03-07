import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { canRetryCustomerOrderPayment } from "@/lib/orders/customer-order-display";
import { initiateNetopiaOrderPayment } from "@/lib/payments/netopia-order-payment";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { orderId } = await params;

    const { db } = await import("@/lib/db");
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      select: {
        id: true,
        paymentMethod: true,
        paymentStatus: true,
        status: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!canRetryCustomerOrderPayment(order)) {
      return NextResponse.json(
        {
          error:
            "This order is not eligible for online payment retry from your account.",
        },
        { status: 400 }
      );
    }

    const { paymentResult } = await initiateNetopiaOrderPayment({
      orderId,
      paymentMethod: order.paymentMethod,
      expectedUserId: session.user.id,
      source: "account",
    });

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId,
      invoiceId: paymentResult.invoiceId,
    });
  } catch (error) {
    console.error("[ACCOUNT][ORDERS] Failed to retry payment:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to reopen the payment session",
      },
      { status: 500 }
    );
  }
}
