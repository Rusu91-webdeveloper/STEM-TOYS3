import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { compensateFailedOrder } from "@/lib/checkout/payment-failure-compensation";
import { DatabaseTemplateService } from "@/lib/email/database-template-service";
import { initiateNetopiaOrderPayment } from "@/lib/payments/netopia-order-payment";

export async function POST(request: Request) {
  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🚀 [API] Netopia Payment Creation Request Received");
  console.log("═══════════════════════════════════════════════════════════");

  let orderId: string | undefined;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    orderId = body?.orderId;
    const { amount, currency = "RON", customerData, paymentMethod } = body;

    console.log("📋 [API] Request Parameters:");
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Amount: ${amount} ${currency}`);
    console.log(`   Payment Method: ${paymentMethod || "Not specified"}`);
    console.log(
      `   Customer: ${customerData?.name || "Not provided"} (${customerData?.email || "No email"})`
    );

    if (!orderId || !amount || amount <= 0) {
      console.error("❌ [API] Validation failed - missing required fields");
      if (orderId) {
        await markOrderFailed(orderId, "validation_failed");
      }
      return NextResponse.json(
        { error: "Missing required fields: orderId, amount" },
        { status: 400 }
      );
    }

    const { db } = await import("@/lib/db");
    const ownedOrder = await db.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!ownedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { order, paymentResult } = await initiateNetopiaOrderPayment({
      orderId,
      paymentMethod,
      customerFallback: customerData,
      expectedUserId: session.user.id,
      source: "checkout",
    });

    console.log("✅ [API] Payment creation completed successfully");
    console.log(`   Order Number: ${order.orderNumber}`);
    console.log(`   Payment URL: ${paymentResult.paymentUrl}`);
    console.log(`   Transaction ID: ${paymentResult.transactionId}`);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const recipientEmail = customerData?.email || order.user?.email;

    if (recipientEmail) {
      const loginUrl = new URL("/auth/login", siteUrl);
      loginUrl.searchParams.set("callbackUrl", `/account/orders/${order.id}`);

      DatabaseTemplateService.sendOrderAwaitingPaymentEmail(recipientEmail, {
        customerName:
          customerData?.name ||
          order.shippingAddress?.fullName ||
          order.user?.name ||
          "Client",
        orderNumber: order.orderNumber || order.id,
        orderTotal: Number(order.total),
        paymentMethodLabel: "Card (Netopia)",
        orderUrl: loginUrl.toString(),
      }).catch(emailError => {
        console.error(
          `❌ [API] Failed to send awaiting payment email for order ${order.id}:`,
          emailError
        );
      });
    }

    console.log("═══════════════════════════════════════════════════════════");
    console.log("");

    return NextResponse.json({
      paymentUrl: paymentResult.paymentUrl,
      invoiceId: paymentResult.invoiceId,
      transactionId: paymentResult.transactionId,
      status: paymentResult.status,
    });
  } catch (error) {
    console.error("");
    console.error(
      "═══════════════════════════════════════════════════════════"
    );
    console.error("❌ [API] Netopia Payment Creation FAILED");
    console.error(
      "═══════════════════════════════════════════════════════════"
    );
    console.error("Error details:", error);
    console.error("");

    if (orderId) {
      await markOrderFailed(orderId, "payment_creation_failed");
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to create payment",
        details:
          process.env.NODE_ENV === "development" ||
          process.env.NETOPIA_DEBUG_MODE === "true"
            ? errorMessage
            : "An error occurred while processing your payment. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}

async function markOrderFailed(orderId: string, reason: string) {
  try {
    await compensateFailedOrder({
      orderId,
      reason,
      source: "netopia_payment_creation_failed",
    });
    console.warn(
      `⚠️ [API] Order ${orderId} marked as FAILED/CANCELLED (${reason})`
    );
  } catch (updateError) {
    console.error(
      `❌ [API] Failed to mark order ${orderId} as failed (${reason}):`,
      updateError
    );
  }
}
