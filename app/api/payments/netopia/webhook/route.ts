import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { NetopiaProvider } from "@/lib/payments/NetopiaProvider";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("x-netopia-signature") || "";

    // Parse the webhook payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (parseError) {
      console.error("Failed to parse webhook payload:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Initialize Netopia provider
    const netopiaProvider = new NetopiaProvider();

    // Handle webhook with signature verification (use raw body for hashing)
    await netopiaProvider.handleWebhook(body, signature);

    // Netopia IPN structure nests payment/order info
    const paymentStatusCode =
      payload?.payment?.status ?? payload?.status ?? payload?.state;
    const ntpID =
      payload?.payment?.ntpID ||
      payload?.payment?.ntpId ||
      payload?.ntpID ||
      payload?.ntpId;
    const orderID = payload?.order?.orderID || payload?.orderID;

    if (orderID) {
      try {
        const { db } = await import("@/lib/db");

        // Update order status based on Netopia notification
        let paymentStatus = "PENDING";
        let orderStatus = "PROCESSING";

        // Map Netopia status codes to our status
        switch (paymentStatusCode) {
          case 3: // Paid
          case 5: // Confirmed
            paymentStatus = "PAID";
            orderStatus = "COMPLETED";
            break;
          case 4: // Cancelled
            paymentStatus = "FAILED";
            orderStatus = "CANCELLED";
            break;
          case 8: // Credit/refund
          case 17: // Reversed
            paymentStatus = "REFUNDED";
            orderStatus = "CANCELLED";
            break;
          case 11: // Error
          case 12: // Declined/rejected
          case 13: // Fraud
            paymentStatus = "FAILED";
            orderStatus = "CANCELLED";
            break;
          default:
            paymentStatus = "PENDING";
            orderStatus = "PROCESSING";
        }

        // Update order in database
        await db.order.update({
          where: { id: orderID },
          data: {
            paymentStatus: paymentStatus as any,
            status: orderStatus as any,
            netopiaTransactionId: ntpID,
            completedAt:
              paymentStatusCode === 3 || paymentStatusCode === 5
                ? new Date()
                : undefined,
          },
        });

        // Get updated order for email processing
        const updatedOrder = await db.order.findUnique({
          where: { id: orderID },
          include: {
            items: true,
            user: true,
            shippingAddress: true,
          },
        });

        if (updatedOrder && (paymentStatusCode === 3 || paymentStatusCode === 5)) {
          // Successful payment
          // Check if order contains digital books
          const digitalItems = await db.orderItem.findMany({
            where: {
              orderId: orderID,
              isDigital: true,
            },
          });

          const hasDigitalBooks = digitalItems.length > 0;

          if (hasDigitalBooks) {
            // Process digital book delivery
            const { processDigitalBookOrder } = await import(
              "@/lib/services/digital-order-service"
            );
            await processDigitalBookOrder(orderID);
          } else {
            // Send order confirmation email for physical products
            if (updatedOrder.user?.email) {
              try {
                const { DatabaseTemplateService } = await import(
                  "@/lib/email/database-template-service"
                );

                const orderNumberForEmail =
                  updatedOrder.orderNumber || updatedOrder.id;

                const sendResult =
                  await DatabaseTemplateService.sendOrderConfirmationEmail(
                    updatedOrder.user.email,
                    {
                      customerName:
                        updatedOrder.shippingAddress?.fullName ||
                        updatedOrder.user?.name ||
                        "Client",
                      orderNumber: String(orderNumberForEmail),
                      orderTotal: updatedOrder.total,
                      items: (updatedOrder.items || []).map((item: any) => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                      })),
                      shippingAddress: updatedOrder.shippingAddress || null,
                    }
                  );

                if (!sendResult.success) {
                  console.error(
                    `Failed to send order confirmation email via template service:`,
                    sendResult.error
                  );
                }
              } catch (emailError) {
                console.error(
                  `Failed to send order confirmation email:`,
                  emailError
                );
              }
            }
          }
        }

        console.log(
          `Netopia webhook processed for order ${orderID}: status=${status}, paymentStatus=${paymentStatus}`
        );
      } catch (dbError) {
        console.error(
          `Failed to process Netopia webhook for order ${orderID}:`,
          dbError
        );
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Netopia webhook error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown webhook error";

    return NextResponse.json(
      {
        error: "Webhook processing failed",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
