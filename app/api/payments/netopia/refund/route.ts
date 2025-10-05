import { NextResponse } from "next/server";
import { NetopiaProvider } from "@/lib/payments/NetopiaProvider";

export async function POST(request: Request) {
  try {
    const { transactionId, amount, reason } = await request.json();

    // Validate required fields
    if (!transactionId) {
      return NextResponse.json(
        { error: "Missing required field: transactionId" },
        { status: 400 }
      );
    }

    // Initialize Netopia provider
    const netopiaProvider = new NetopiaProvider();

    // Attempt refund (this will currently throw an error indicating manual processing needed)
    try {
      const refundResult = await netopiaProvider.refund(
        transactionId,
        amount || 0
      );

      // Update database with refund information
      try {
        const { db } = await import("@/lib/db");

        // Find order by transaction ID
        const order = await db.order.findFirst({
          where: { netopiaTransactionId: transactionId },
        });

        if (order) {
          await db.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: "REFUNDED",
              notes: order.notes
                ? `${order.notes}\n[REFUNDED: ${refundResult.refundId} - ${new Date().toISOString()}]`
                : `[REFUNDED: ${refundResult.refundId} - ${new Date().toISOString()}]`,
            },
          });
        }
      } catch (dbError) {
        console.error("Failed to update order with refund data:", dbError);
      }

      return NextResponse.json({
        refundId: refundResult.refundId,
        status: refundResult.status,
        amount: refundResult.amount,
        transactionId: refundResult.transactionId,
      });
    } catch (refundError) {
      // Netopia SDK doesn't support refunds through API
      // Log the refund request for manual processing
      console.log("Netopia refund requested (manual processing required):", {
        transactionId,
        amount,
        reason,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          error:
            "Refund must be processed manually through Netopia merchant dashboard",
          details:
            "The Netopia payment system requires refunds to be processed through their merchant portal. Please contact Netopia support or use their dashboard to process this refund.",
          transactionId,
          requestedAmount: amount,
          reason,
          manualProcessingRequired: true,
        },
        { status: 501 } // Not Implemented
      );
    }
  } catch (error) {
    console.error("Error processing Netopia refund:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to process refund",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
