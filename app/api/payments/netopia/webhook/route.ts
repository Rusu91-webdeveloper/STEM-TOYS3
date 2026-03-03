import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { NetopiaProvider } from "@/lib/payments/NetopiaProvider";

/**
 * Netopia IPN (Instant Payment Notification) webhook.
 * NETOPIA requires notifyURL to return:
 * - HTTP 200
 * - Content-Type: application/json
 * - Body: {"errorCode": 0}
 * This route must never return 4xx/5xx — always return 200 with { errorCode: 0 }.
 */
export async function POST(request: Request) {
  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🔔 [WEBHOOK] Netopia IPN Received");
  console.log("🕐 [WEBHOOK] Timestamp:", new Date().toISOString());
  console.log(
    "🌍 [WEBHOOK] Environment:",
    process.env.NETOPIA_SANDBOX === "true" ? "SANDBOX" : "PRODUCTION"
  );
  console.log("═══════════════════════════════════════════════════════════");

  // NETOPIA requires exact response format: {"errorCode": 0} — no extra fields
  const ok = () => NextResponse.json({ errorCode: 0 }, { status: 200 });

  try {
    const requestUrl = new URL(request.url);
    const orderIdFromQuery = requestUrl.searchParams.get("orderId");
    const orderNumberFromQuery = requestUrl.searchParams.get("orderNumber");

    const body = await request.text();
    const headersList = await headers();
    const signatureHeaderCandidates = [
      "x-netopia-signature",
      "x-verification-token",
      "verification-token",
      "verification_token",
      "x-signature",
      "signature",
    ];

    const normalizeSignatureToken = (raw: string): string => {
      let value = raw.trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1).trim();
      }
      value = value.replace(/^Bearer\s+/i, "").trim();
      return value;
    };

    const signatureSources = signatureHeaderCandidates.flatMap(name => {
      const rawValue = headersList.get(name);
      if (!rawValue) return [];

      const normalized = normalizeSignatureToken(rawValue);
      if (!normalized) return [];

      const variants = normalized.includes(",")
        ? normalized
            .split(",")
            .map(part => normalizeSignatureToken(part))
            .filter(Boolean)
        : [normalized];

      return variants.map(value => ({ header: name, value }));
    });

    const uniqueSignatureSources = signatureSources.filter(
      (item, index, arr) =>
        arr.findIndex(candidate => candidate.value === item.value) === index
    );

    console.log("📩 [WEBHOOK] Request details:");
    console.log(`   Content-Length: ${body.length} bytes`);
    console.log(
      `   Has Signature: ${uniqueSignatureSources.length > 0 ? "Yes" : "No"}`
    );
    if (uniqueSignatureSources.length > 0) {
      const preview = uniqueSignatureSources
        .map(source => `${source.header}:${source.value.slice(0, 18)}...`)
        .join(", ");
      console.log(`   Signature candidates: ${preview}`);
    }

    // Parse the webhook payload
    let payload;
    try {
      payload = JSON.parse(body);
      console.log("✅ [WEBHOOK] Payload parsed successfully");
    } catch (parseError) {
      console.error("❌ [WEBHOOK] Failed to parse payload:", parseError);
      // Netopia requires HTTP 200 on notifyURL even on errors.
      return ok();
    }

    // Initialize Netopia provider
    console.log("🔧 [WEBHOOK] Initializing Netopia provider...");
    const netopiaProvider = new NetopiaProvider();

    // Handle webhook with signature verification (use raw body for hashing)
    console.log("🔐 [WEBHOOK] Verifying signature...");
    let signatureVerified = false;
    const verificationErrors: string[] = [];

    const candidates =
      uniqueSignatureSources.length > 0
        ? uniqueSignatureSources
        : [{ header: "none", value: "" }];

    for (const candidate of candidates) {
      try {
        await netopiaProvider.handleWebhook(body, candidate.value);
        console.log(
          `✅ [WEBHOOK] Signature verified successfully (header: ${candidate.header})`
        );
        signatureVerified = true;
        break;
      } catch (verificationError) {
        const message =
          verificationError instanceof Error
            ? verificationError.message
            : String(verificationError);
        verificationErrors.push(`${candidate.header}: ${message}`);
      }
    }

    if (!signatureVerified) {
      console.error(
        "❌ [WEBHOOK] Signature verification failed:",
        verificationErrors.join(" | ")
      );
      // Do not process further, but still acknowledge with HTTP 200.
      return ok();
    }

    // Netopia IPN structure nests payment/order info
    const rawStatus =
      payload?.payment?.status ?? payload?.status ?? payload?.state;
    const paymentStatusCode =
      typeof rawStatus === "string" ? parseInt(rawStatus, 10) : rawStatus;
    const normalizedStatusCode = Number.isFinite(paymentStatusCode)
      ? paymentStatusCode
      : undefined;
    const normalizeId = (value: unknown): string | null => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed || null;
      }
      if (typeof value === "number" && Number.isFinite(value)) {
        return String(Math.trunc(value));
      }
      if (typeof value === "bigint") {
        return value.toString();
      }
      return null;
    };

    const ntpID = normalizeId(
      payload?.payment?.ntpID ??
        payload?.payment?.ntpId ??
        payload?.ntpID ??
        payload?.ntpId
    );
    const orderID = normalizeId(
      orderIdFromQuery ??
        orderNumberFromQuery ??
        payload?.order?.orderID ??
        payload?.order?.orderId ??
        payload?.order?.id ??
        payload?.order?.data?.orderID ??
        payload?.order?.data?.orderId ??
        payload?.order?.data?.id ??
        payload?.data?.orderId ??
        payload?.data?.orderID ??
        payload?.orderID ??
        payload?.orderId ??
        payload?.order_id
    );
    const amount = payload?.payment?.amount ?? payload?.amount;
    const currency = payload?.payment?.currency ?? payload?.currency;

    console.log("📋 [WEBHOOK] Payment notification details:");
    console.log(`   Order ID: ${orderID || "Not provided"}`);
    console.log(`   Transaction ID: ${ntpID || "Not provided"}`);
    console.log(
      `   Status Code: ${
        normalizedStatusCode ?? rawStatus ?? "Not provided"
      }`
    );
    console.log(`   Amount: ${amount} ${currency || ""}`);

    if (orderID || ntpID) {
      const orderIdentifier = orderID || ntpID;
      console.log(`🗄️  [WEBHOOK] Processing order ${orderIdentifier}...`);
      let resolvedOrderId: string | null = null;

      try {
        const { db } = await import("@/lib/db");

        // Update order status based on Netopia notification
        let paymentStatus = "PENDING";
        let orderStatus = "PROCESSING";

        // First, locate the order robustly and check if it has digital books.
        // Netopia may send id as orderID/orderId or we can resolve by ntpID.
        const orderSearchClauses: Record<string, string>[] = [];
        if (orderID) {
          orderSearchClauses.push({ id: orderID }, { orderNumber: orderID });
        }
        if (ntpID) {
          orderSearchClauses.push(
            { netopiaTransactionId: ntpID },
            { netopiaInvoiceId: ntpID }
          );
        }
        const orderBeforeUpdate = await db.order.findFirst({
          where: {
            OR: orderSearchClauses,
          },
          include: {
            items: true,
          },
        });

        if (!orderBeforeUpdate) {
          console.warn(
            `⚠️ [WEBHOOK] Could not match order from payload (orderID=${orderID ?? "n/a"}, ntpID=${ntpID ?? "n/a"})`
          );
          return ok();
        }

        resolvedOrderId = orderBeforeUpdate.id;

        const allItemsAreDigital =
          orderBeforeUpdate?.items &&
          orderBeforeUpdate.items.length > 0 &&
          orderBeforeUpdate.items.every(item => item.isDigital === true);

        const isPaymentSuccess =
          normalizedStatusCode === 3 || normalizedStatusCode === 5;

        // Map Netopia status codes to our status
        console.log(
          `🔄 [WEBHOOK] Mapping status code ${
            normalizedStatusCode ?? "Unknown"
          }...`
        );
        switch (normalizedStatusCode) {
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
          where: { id: resolvedOrderId },
          data: {
            paymentStatus: paymentStatus as any,
            status: orderStatus as any,
            netopiaTransactionId:
              ntpID || orderBeforeUpdate.netopiaTransactionId || null,
            // Set deliveredAt for digital orders, completedAt for others
            ...(allItemsAreDigital && isPaymentSuccess
              ? { deliveredAt: new Date() }
              : isPaymentSuccess
                ? { completedAt: new Date() }
                : {}),
          },
        });
        console.log("✅ [WEBHOOK] Order updated successfully");

        // Get updated order for email processing
        console.log("📧 [WEBHOOK] Preparing post-payment processing...");
        const updatedOrder = await db.order.findUnique({
          where: { id: resolvedOrderId },
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
          isPaymentSuccess &&
          updatedOrder.paymentStatus === "PAID"
        ) {
          console.log(
            "✅ [WEBHOOK] Payment successful and verified - processing order fulfillment"
          );

          const hasPhysicalItems = updatedOrder.items.some(
            item => item.isDigital !== true
          );
          if (hasPhysicalItems) {
            let supplierOrderCount = await db.supplierOrder.count({
              where: { orderId: resolvedOrderId },
            });
            try {
              const { OrderProcessor } = await import("@/lib/order-processor");
              if (supplierOrderCount === 0) {
                const processResult =
                  await OrderProcessor.processNewOrder(resolvedOrderId);
                if (!processResult.success && processResult.errors.length > 0) {
                  console.warn(
                    `[WEBHOOK] Supplier orders had errors for order ${resolvedOrderId}:`,
                    processResult.errors
                  );
                } else if (processResult.supplierOrders.length > 0) {
                  console.log(
                    `✅ [WEBHOOK] Created ${processResult.supplierOrders.length} supplier order(s) for order ${resolvedOrderId}`
                  );
                }
                supplierOrderCount = await db.supplierOrder.count({
                  where: { orderId: resolvedOrderId },
                });
              }
            } catch (processorError) {
              console.error(
                `❌ [WEBHOOK] OrderProcessor failed for order ${resolvedOrderId}:`,
                processorError
              );
            }
            if (supplierOrderCount === 0) {
              const reason =
                "Supplier orders were not created after Netopia payment confirmation. Manual fulfillment review required: create or fix supplier lines in Admin and then create the AWB/shipping label manually.";
              await db.order.update({
                where: { id: resolvedOrderId },
                data: {
                  manualShippingReviewRequired: true,
                  shippingReviewReason: reason,
                },
              });
              // Notify admin that this order needs manual supplier/shipping review
              const { AdminNotificationService } = await import(
                "@/lib/email/admin-notification-service"
              );
              AdminNotificationService.sendOrderIssueNotification(
                resolvedOrderId,
                "MANUAL_SHIPPING_REVIEW_REQUIRED",
                reason,
                "HIGH"
              ).catch(err => {
                console.error(
                  `⚠️ [WEBHOOK] Failed to send manual shipping review notification for order ${resolvedOrderId}:`,
                  err
                );
              });
              console.warn(
                `⚠️ [WEBHOOK] Skipping AWB for order ${resolvedOrderId}: ${reason}`
              );
            } else {
              try {
                const existingAwbShipment = await db.shipment.findFirst({
                  where: {
                    orderId: resolvedOrderId,
                    awbNumber: { not: null },
                  },
                  select: { awbNumber: true, courier: true },
                });
                if (existingAwbShipment?.awbNumber) {
                  console.log(
                    `ℹ️ [WEBHOOK] AWB already exists for order ${resolvedOrderId}: ${existingAwbShipment.awbNumber} (${existingAwbShipment.courier})`
                  );
                } else {
                  const { createCourierAwbForOrder } = await import(
                    "@/lib/shipping/awb-dispatcher"
                  );
                  const awbResult =
                    await createCourierAwbForOrder(resolvedOrderId);
                  if (awbResult.success) {
                    console.log(
                      `✅ [WEBHOOK] AWB created for order ${resolvedOrderId}: ${awbResult.awbNumber}`
                    );
                  } else {
                    console.warn(
                      `⚠️ [WEBHOOK] AWB creation failed for order ${resolvedOrderId}:`,
                      awbResult.error
                    );
                  }
                }
              } catch (awbError) {
                console.error(
                  `❌ [WEBHOOK] AWB creation error for order ${resolvedOrderId}:`,
                  awbError
                );
              }
            }
          }

          // Check if order contains digital books
          const digitalItems = await db.orderItem.findMany({
            where: {
              orderId: resolvedOrderId,
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
              await processDigitalBookOrder(resolvedOrderId);
              console.log(
                "✅ [WEBHOOK] Digital books processed and delivery email sent"
              );
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
        console.log(`   Order ID: ${resolvedOrderId}`);
        console.log(`   Payment Status: ${paymentStatus}`);
        console.log(`   Order Status: ${orderStatus}`);
      } catch (dbError) {
        console.error(
          `❌ [WEBHOOK] Failed to process order ${orderID || ntpID}:`,
          dbError
        );
        // Netopia requires HTTP 200 on notifyURL even on errors.
        return ok();
      }
    } else {
      console.warn(
        "⚠️  [WEBHOOK] No order ID or transaction ID in payload - skipping database update"
      );
    }

    console.log("✅ [WEBHOOK] Webhook processed successfully");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");

    return ok();
  } catch (error) {
    console.error("");
    console.error(
      "═══════════════════════════════════════════════════════════"
    );
    console.error("❌ [WEBHOOK] Webhook Processing Failed");
    console.error(
      "═══════════════════════════════════════════════════════════"
    );
    console.error("Error details:", error);
    console.error("");

    const errorMessage =
      error instanceof Error ? error.message : "Unknown webhook error";

    // Netopia requires HTTP 200 on notifyURL even on errors.
    return ok();
  }
}
