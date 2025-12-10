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

    // Try to hydrate order if not already loaded
    if (!orderRecord) {
      try {
        const { db } = await import("@/lib/db");
        orderRecord = await db.order.findFirst({
          where: {
            OR: [
              orderId ? { id: orderId } : undefined,
              { netopiaTransactionId: finalTransactionId },
            ].filter(Boolean) as any,
          },
          include: { user: true, shippingAddress: true, items: true },
        });
      } catch (dbError) {
        console.error("Database lookup (post-status) failed:", dbError);
      }
    }

    // DEV/LOCAL FALLBACK: If payment is confirmed but webhook didn't run, mark paid + send email once
    const shouldForce =
      searchParams.get("force") === "1" &&
      process.env.NODE_ENV !== "production";

    if ((statusResult.status === "paid" || shouldForce) && orderRecord) {
      try {
        const { db } = await import("@/lib/db");
        if (orderRecord.paymentStatus !== "PAID") {
          await db.order.update({
            where: { id: orderRecord.id },
            data: {
              paymentStatus: "PAID",
              status:
                orderRecord.status === "PENDING"
                  ? "PROCESSING"
                  : orderRecord.status,
              netopiaTransactionId:
                orderRecord.netopiaTransactionId || finalTransactionId,
            },
          });
          console.log(
            `✅ [NETOPIA][STATUS] Marked order ${orderRecord.id} as PAID (fallback)`
          );

          // Send confirmation email (only if we have a recipient)
          const recipientEmail =
            orderRecord.user?.email ||
            (orderRecord as any).email ||
            (orderRecord as any).billingEmail ||
            orderRecord.shippingAddress?.email ||
            undefined;

          if (recipientEmail) {
            const { DatabaseTemplateService } = await import(
              "@/lib/email/database-template-service"
            );

            const sendResult =
              await DatabaseTemplateService.sendOrderConfirmationEmail(
                recipientEmail,
                {
                  customerName:
                    orderRecord.shippingAddress?.fullName ||
                    orderRecord.user?.name ||
                    "Client",
                  orderNumber: String(
                    orderRecord.orderNumber || orderRecord.id
                  ),
                  orderTotal: orderRecord.total,
                  items: (orderRecord.items || []).map((item: any) => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                  })),
                  shippingAddress: orderRecord.shippingAddress || null,
                }
              );

            if (sendResult.success) {
              console.log(
                `✅ [NETOPIA][STATUS] Order confirmation email sent to ${recipientEmail}`
              );
            } else {
              console.error(
                `❌ [NETOPIA][STATUS] Failed to send order confirmation email:`,
                sendResult.error
              );
            }
          } else {
            console.warn(
              `⚠️ [NETOPIA][STATUS] Payment succeeded but no email found for order ${orderRecord.id}`
            );
          }
        }
      } catch (updateError) {
        console.error(
          `❌ [NETOPIA][STATUS] Failed to mark order as paid/send email:`,
          updateError
        );
      }
    }

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
