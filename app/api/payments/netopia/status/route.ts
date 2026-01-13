import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { NetopiaProvider } from "@/lib/payments/NetopiaProvider";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");
    const orderId = searchParams.get("orderId");

    if (!transactionId && !orderId) {
      return NextResponse.json(
        { error: "Missing transactionId or orderId parameter" },
        { status: 400 }
      );
    }

    // If we have orderId but not transactionId, look it up in database
    let finalTransactionId = transactionId;
    let orderRecord:
      | Prisma.OrderGetPayload<{
          include: { user: true; shippingAddress: true; items: true };
        }>
      | null
      | undefined;
    if (!finalTransactionId && orderId) {
      try {
        const { db } = await import("@/lib/db");
        orderRecord = await db.order.findUnique({
          where: { id: orderId },
          include: { user: true, shippingAddress: true, items: true },
        });

        if (orderRecord?.netopiaTransactionId) {
          finalTransactionId = orderRecord.netopiaTransactionId;
        } else {
          return NextResponse.json(
            { error: "No Netopia transaction found for this order" },
            { status: 404 }
          );
        }
      } catch (dbError) {
        console.error("Database lookup failed:", dbError);
        return NextResponse.json(
          { error: "Failed to lookup transaction" },
          { status: 500 }
        );
      }
    }

    if (!finalTransactionId) {
      return NextResponse.json(
        { error: "Transaction ID not found" },
        { status: 404 }
      );
    }

    // Initialize Netopia provider
    const netopiaProvider = new NetopiaProvider();

    // Get payment status
    const statusResult = await netopiaProvider.getPaymentStatus(
      finalTransactionId
    );

    console.log("[NETOPIA][STATUS] Poll result", {
      orderId,
      transactionId: finalTransactionId,
      status: statusResult.status,
      amount: statusResult.amount,
      currency: statusResult.currency,
    });

    // ⚠️ CRITICAL: Status API is READ-ONLY - it should NOT update database or send emails
    // Only the webhook (/api/payments/netopia/webhook) should mark orders as paid and process digital books
    // This prevents digital book delivery when payment verification fails or Netopia is misconfigured

    return NextResponse.json({
      transactionId: statusResult.transactionId,
      status: statusResult.status,
      amount: statusResult.amount,
      currency: statusResult.currency,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking Netopia payment status:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to check payment status",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
