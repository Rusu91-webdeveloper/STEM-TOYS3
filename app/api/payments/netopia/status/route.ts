import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");
    const orderId = searchParams.get("orderId");
    const forceComplete = searchParams.get("force") === "1";

    if (!transactionId && !orderId) {
      return NextResponse.json(
        { error: "Missing transactionId or orderId parameter" },
        { status: 400 }
      );
    }

    // Look up the order in database first
    let finalTransactionId = transactionId;
    let orderRecord:
      | Prisma.OrderGetPayload<{
          include: { user: true; shippingAddress: true; items: true };
        }>
      | null
      | undefined;

    try {
      const { db } = await import("@/lib/db");

      if (orderId) {
        orderRecord = await db.order.findUnique({
          where: { id: orderId },
          include: { user: true, shippingAddress: true, items: true },
        });
      } else if (transactionId) {
        orderRecord = await db.order.findFirst({
          where: { netopiaTransactionId: transactionId },
          include: { user: true, shippingAddress: true, items: true },
        });
      }

      if (orderRecord?.netopiaTransactionId) {
        finalTransactionId = orderRecord.netopiaTransactionId;
      }
    } catch (dbError) {
      console.error("[NETOPIA][STATUS] Database lookup failed:", dbError);
    }

    // PRIORITY 1: Check database status first (most reliable)
    // The webhook updates the database, so if payment succeeded, it will be reflected here
    if (orderRecord) {
      const dbStatus = mapPaymentStatusFromDb(orderRecord.paymentStatus);

      console.log("[NETOPIA][STATUS] Database status check", {
        orderId: orderRecord.id,
        paymentStatus: orderRecord.paymentStatus,
        mappedStatus: dbStatus,
        transactionId: finalTransactionId,
      });

      // If the order is already marked as paid/refunded in DB, trust that
      if (dbStatus === "paid" || dbStatus === "refunded") {
        return NextResponse.json({
          transactionId: finalTransactionId || orderId,
          status: dbStatus,
          amount: orderRecord.total,
          currency: "RON",
          timestamp: new Date().toISOString(),
          source: "database",
        });
      }

      // If the order is marked as failed in DB, return that
      if (dbStatus === "failed" || dbStatus === "cancelled") {
        return NextResponse.json({
          transactionId: finalTransactionId || orderId,
          status: dbStatus,
          amount: orderRecord.total,
          currency: "RON",
          timestamp: new Date().toISOString(),
          source: "database",
        });
      }

      // Handle force complete for development or sandbox testing
      const isSandboxMode = process.env.NETOPIA_SANDBOX === "true";
      const isDevelopment = process.env.NODE_ENV === "development";

      if (forceComplete && (isDevelopment || isSandboxMode)) {
        console.log(
          "[NETOPIA][STATUS] Force completing order for sandbox/dev testing",
          {
            orderId: orderRecord.id,
            isSandboxMode,
            isDevelopment,
          }
        );
        const { db } = await import("@/lib/db");
        await db.order.update({
          where: { id: orderRecord.id },
          data: {
            paymentStatus: "PAID",
            status: "PROCESSING",
          },
        });
        return NextResponse.json({
          transactionId: finalTransactionId || orderId,
          status: "paid",
          amount: orderRecord.total,
          currency: "RON",
          timestamp: new Date().toISOString(),
          source: "force_complete",
        });
      }
    }

    // Check if we're in sandbox mode (for client to show force complete button)
    const sandboxMode = process.env.NETOPIA_SANDBOX === "true";

    // PRIORITY 2: If no transaction ID, we can't query Netopia API
    if (!finalTransactionId) {
      // Return pending status - webhook hasn't arrived yet
      return NextResponse.json({
        transactionId: orderId,
        status: "pending",
        amount: orderRecord?.total || 0,
        currency: "RON",
        timestamp: new Date().toISOString(),
        source: "no_transaction_id",
        message: "Waiting for payment confirmation from Netopia",
        sandboxMode,
      });
    }

    // PRIORITY 3: Try to query Netopia API for status (may fail in sandbox)
    try {
      const { NetopiaProvider } = await import(
        "@/lib/payments/NetopiaProvider"
      );
      const netopiaProvider = new NetopiaProvider();
      const statusResult =
        await netopiaProvider.getPaymentStatus(finalTransactionId);

      console.log("[NETOPIA][STATUS] API poll result", {
        orderId,
        transactionId: finalTransactionId,
        status: statusResult.status,
        amount: statusResult.amount,
        currency: statusResult.currency,
      });

      return NextResponse.json({
        transactionId: statusResult.transactionId,
        status:
          statusResult.status === "paid" || statusResult.status === "refunded"
            ? "pending"
            : statusResult.status,
        amount: statusResult.amount,
        currency: statusResult.currency,
        timestamp: new Date().toISOString(),
        source:
          statusResult.status === "paid" || statusResult.status === "refunded"
            ? "netopia_api_pending_webhook"
            : "netopia_api",
        ...(statusResult.status === "paid" || statusResult.status === "refunded"
          ? {
              providerStatus: statusResult.status,
              message:
                "Payment is confirmed by Netopia but the order is still being finalized on our side. Waiting for webhook reconciliation.",
            }
          : {}),
      });
    } catch (netopiaError) {
      console.warn(
        "[NETOPIA][STATUS] Netopia API call failed (this is normal in sandbox):",
        netopiaError instanceof Error ? netopiaError.message : netopiaError
      );

      // In sandbox mode, Netopia API status check often fails
      // Return pending and let the webhook update the status
      return NextResponse.json({
        transactionId: finalTransactionId,
        status: "pending",
        amount: orderRecord?.total || 0,
        currency: "RON",
        timestamp: new Date().toISOString(),
        source: "netopia_api_fallback",
        message: "Waiting for webhook confirmation from Netopia",
        sandboxMode,
      });
    }
  } catch (error) {
    console.error("[NETOPIA][STATUS] Error checking payment status:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    const sandboxMode = process.env.NETOPIA_SANDBOX === "true";

    return NextResponse.json(
      {
        error: "Failed to check payment status",
        status: "pending",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 200 } // Return 200 with error info instead of 500 to prevent JSON parse errors
    );
  }
}

// Map database payment status to frontend status
function mapPaymentStatusFromDb(dbStatus: string | null): string {
  switch (dbStatus?.toUpperCase()) {
    case "PAID":
    case "COMPLETED":
      return "paid";
    case "REFUNDED":
      return "refunded";
    case "FAILED":
      return "failed";
    case "CANCELLED":
    case "CANCELED":
      return "cancelled";
    case "PENDING":
    case "PROCESSING":
    default:
      return "pending";
  }
}
