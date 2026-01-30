import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { NetopiaProvider } from "@/lib/payments/NetopiaProvider";

export async function POST(request: Request) {
  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🔔 [WEBHOOK] Netopia IPN Received");
  console.log("🕐 [WEBHOOK] Timestamp:", new Date().toISOString());
  console.log("🌍 [WEBHOOK] Environment:", process.env.NETOPIA_SANDBOX === "true" ? "SANDBOX" : "PRODUCTION");
  console.log("═══════════════════════════════════════════════════════════");

  const ok = (extra?: Record<string, unknown>) =>
    NextResponse.json({ received: true, ...extra });

  try {
    const body = await request.text();
    const headersList = await headers();
    const signature =
      headersList.get("x-netopia-signature") ||
      headersList.get("verification-token") ||
      headersList.get("Verification-token") ||
      "";

    console.log("📩 [WEBHOOK] Request details:");
    console.log(`   Content-Length: ${body.length} bytes`);
    console.log(`   Has Signature: ${signature ? "Yes" : "No"}`);

    // Parse the webhook payload
    let payload;
    try {
      payload = JSON.parse(body);
      console.log("✅ [WEBHOOK] Payload parsed successfully");
    } catch (parseError) {
      console.error("❌ [WEBHOOK] Failed to parse payload:", parseError);
      // Netopia requires HTTP 200 on notifyURL even on errors.
      return ok({ error: "Invalid JSON payload" });
    }

    // Initialize Netopia provider
    console.log("🔧 [WEBHOOK] Initializing Netopia provider...");
    const netopiaProvider = new NetopiaProvider();

    // Handle webhook with signature verification (use raw body for hashing)
    console.log("🔐 [WEBHOOK] Verifying signature...");
    try {
      await netopiaProvider.handleWebhook(body, signature);
      console.log("✅ [WEBHOOK] Signature verified successfully");
    } catch (verificationError) {
      console.error(
        "❌ [WEBHOOK] Signature verification failed:",
        verificationError
      );
      // Do not process further, but still acknowledge with HTTP 200.
      return ok({ error: "Signature verification failed" });
    }

    // Netopia IPN structure nests payment/order info
    const paymentStatusCode =
      payload?.payment?.status ?? payload?.status ?? payload?.state;
    const ntpID =
      payload?.payment?.ntpID ||
      payload?.payment?.ntpId ||
      payload?.ntpID ||
      payload?.ntpId;
    const orderID = payload?.order?.orderID || payload?.orderID;
    const amount = payload?.payment?.amount ?? payload?.amount;
    const currency = payload?.payment?.currency ?? payload?.currency;

    console.log("📋 [WEBHOOK] Payment notification details:");
    console.log(`   Order ID: ${orderID || "Not provided"}`);
    console.log(`   Transaction ID: ${ntpID || "Not provided"}`);
    console.log(`   Status Code: ${paymentStatusCode}`);
    console.log(`   Amount: ${amount} ${currency || ""}`);

    if (orderID) {
      console.log(`🗄️  [WEBHOOK] Processing order ${orderID}...`);

      try {
        const { db } = await import("@/lib/db");

        // Update order status based on Netopia notification
        let paymentStatus = "PENDING";
        let orderStatus = "PROCESSING";

        // First, check if order has digital books to determine correct status
        const orderBeforeUpdate = await db.order.findUnique({
          where: { id: orderID },
          include: {
            items: true,
          },
        });

        const allItemsAreDigital =
          orderBeforeUpdate?.items &&
          orderBeforeUpdate.items.length > 0 &&
          orderBeforeUpdate.items.every(item => item.isDigital === true);

        // Map Netopia status codes to our status
        console.log(`🔄 [WEBHOOK] Mapping status code ${paymentStatusCode}...`);
        switch (paymentStatusCode) {
          case 3: // Paid
          case 5: // Confirmed
            paymentStatus = "PAID";
            // For digital-only orders, use DELIVERED instead of COMPLETED
            orderStatus = allItemsAreDigital ? "DELIVERED" : "PROCESSING";
            console.log(
              `✅ [WEBHOOK] Payment successful (${allItemsAreDigital ? "Digital order - DELIVERED" : "Physical order - PROCESSING"})`
            );
            break;
          case 4: // Cancelled
            paymentStatus = "FAILED";
            orderStatus = "CANCELLED";
            console.log("❌ [WEBHOOK] Payment cancelled");
            break;
          case 8: // Credit/refund
          case 17: // Reversed
            paymentStatus = "REFUNDED";
            orderStatus = "CANCELLED";
            console.log("💰 [WEBHOOK] Payment refunded");
            break;
          case 11: // Error
          case 12: // Declined/rejected
          case 13: // Fraud
            paymentStatus = "FAILED";
            orderStatus = "CANCELLED";
            console.log("❌ [WEBHOOK] Payment failed/declined");
            break;
          default:
            paymentStatus = "PENDING";
            orderStatus = "PROCESSING";
            console.log("⏳ [WEBHOOK] Payment pending");
        }

        console.log(`   New Payment Status: ${paymentStatus}`);
        console.log(`   New Order Status: ${orderStatus}`);

        // Update order in database
        console.log("💾 [WEBHOOK] Updating order in database...");
        await db.order.update({
          where: { id: orderID },
          data: {
            paymentStatus: paymentStatus as any,
            status: orderStatus as any,
            netopiaTransactionId: ntpID,
            // Set deliveredAt for digital orders, completedAt for others
            ...(allItemsAreDigital && (paymentStatusCode === 3 || paymentStatusCode === 5)
              ? { deliveredAt: new Date() }
              : paymentStatusCode === 3 || paymentStatusCode === 5
                ? { completedAt: new Date() }
                : {}),
          },
        });
        console.log("✅ [WEBHOOK] Order updated successfully");

        // Get updated order for email processing
        console.log("📧 [WEBHOOK] Preparing post-payment processing...");
        const updatedOrder = await db.order.findUnique({
          where: { id: orderID },
          include: {
            items: true,
            user: true,
            shippingAddress: true,
          },
        });

        // ⚠️ CRITICAL: Only process digital books if payment was actually verified as successful
        // paymentStatusCode 3 = Paid, 5 = Confirmed (both indicate successful payment)
        // Also verify the order was actually marked as PAID in the database
        if (
          updatedOrder &&
          (paymentStatusCode === 3 || paymentStatusCode === 5) &&
          updatedOrder.paymentStatus === "PAID"
        ) {
          console.log("✅ [WEBHOOK] Payment successful and verified - processing order fulfillment");

          const hasPhysicalItems = updatedOrder.items.some(
            item => item.isDigital !== true
          );
          if (hasPhysicalItems) {
            try {
              const { createCourierAwbForOrder } = await import(
                "@/lib/shipping/awb-dispatcher"
              );
              const awbResult = await createCourierAwbForOrder(orderID);
              if (awbResult.success) {
                console.log(
                  `✅ [WEBHOOK] AWB created for order ${orderID}: ${awbResult.awbNumber}`
                );
              } else {
                console.warn(
                  `⚠️ [WEBHOOK] AWB creation failed for order ${orderID}:`,
                  awbResult.error
                );
              }
            } catch (awbError) {
              console.error(
                `❌ [WEBHOOK] AWB creation error for order ${orderID}:`,
                awbError
              );
            }
          }

          // Check if order contains digital books
          const digitalItems = await db.orderItem.findMany({
            where: {
              orderId: orderID,
              isDigital: true,
            },
          });

          const hasDigitalBooks = digitalItems.length > 0;

          if (hasDigitalBooks) {
            console.log("📚 [WEBHOOK] Processing digital book delivery...");
            // Process digital book delivery
            const { processDigitalBookOrder } = await import(
              "@/lib/services/digital-order-service"
            );
            try {
              await processDigitalBookOrder(orderID);
              console.log("✅ [WEBHOOK] Digital books processed and delivery email sent");
            } catch (digitalError) {
              console.error(
                `❌ [WEBHOOK] Failed to process digital books:`,
                digitalError
              );
              // Continue to send confirmation email even if digital processing fails
            }

            // Send confirmation email for digital orders (in addition to delivery email)
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
                      subtotal: updatedOrder.subtotal,
                      tax: updatedOrder.tax,
                      shippingCost: updatedOrder.shippingCost,
                      discountAmount: updatedOrder.discountAmount ?? 0,
                      codFee: updatedOrder.codFeeEstimate ?? 0,
                    }
                  );

                if (!sendResult.success) {
                  console.error(
                    `❌ [WEBHOOK] Failed to send order confirmation email:`,
                    sendResult.error
                  );
                } else {
                  console.log("✅ [WEBHOOK] Order confirmation email sent");
                }
              } catch (emailError) {
                console.error(
                  `❌ [WEBHOOK] Failed to send order confirmation email:`,
                  emailError
                );
              }
            }
          } else {
            console.log("📦 [WEBHOOK] Processing physical product order...");
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
                      subtotal: updatedOrder.subtotal,
                      tax: updatedOrder.tax,
                      shippingCost: updatedOrder.shippingCost,
                      discountAmount: updatedOrder.discountAmount ?? 0,
                      codFee: updatedOrder.codFeeEstimate ?? 0,
                    }
                  );

                if (!sendResult.success) {
                  console.error(
                    `❌ [WEBHOOK] Failed to send order confirmation email:`,
                    sendResult.error
                  );
                } else {
                  console.log("✅ [WEBHOOK] Order confirmation email sent");
                }
              } catch (emailError) {
                console.error(
                  `❌ [WEBHOOK] Failed to send order confirmation email:`,
                  emailError
                );
              }
            }
          }
        }

        console.log("✅ [WEBHOOK] Order processing completed");
        console.log(`   Order ID: ${orderID}`);
        console.log(`   Payment Status: ${paymentStatus}`);
        console.log(`   Order Status: ${orderStatus}`);
      } catch (dbError) {
        console.error(
          `❌ [WEBHOOK] Failed to process order ${orderID}:`,
          dbError
        );
        // Netopia requires HTTP 200 on notifyURL even on errors.
        return ok({ error: "Database update failed" });
      }
    } else {
      console.warn("⚠️  [WEBHOOK] No order ID in payload - skipping database update");
    }

    console.log("✅ [WEBHOOK] Webhook processed successfully");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");

    return ok();
  } catch (error) {
    console.error("");
    console.error("═══════════════════════════════════════════════════════════");
    console.error("❌ [WEBHOOK] Webhook Processing Failed");
    console.error("═══════════════════════════════════════════════════════════");
    console.error("Error details:", error);
    console.error("");

    const errorMessage =
      error instanceof Error ? error.message : "Unknown webhook error";

    // Netopia requires HTTP 200 on notifyURL even on errors.
    return ok({
      error: "Webhook processing failed",
      details:
        process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}
