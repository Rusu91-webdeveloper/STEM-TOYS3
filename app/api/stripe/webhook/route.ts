import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getRequiredEnvVar } from "@/lib/env";
import {
  getStripeApiVersion,
  getStripeWebhookSecret,
  isStripeEnabled,
  validateStripeSecretKey,
} from "@/lib/stripe-config";

// Note: Stripe initialization and env validation are performed inside the POST handler

// Webhook signature verification tolerance (300 seconds = 5 minutes)
// This accounts for clock skew between Stripe's servers and ours
const WEBHOOK_TOLERANCE = 300;

export async function POST(request: Request) {
  // If Stripe is disabled, acknowledge and exit
  if (!isStripeEnabled()) {
    return NextResponse.json({ received: true, disabled: true });
  }

  // Initialize Stripe at request-time
  const stripeSecretKey = getRequiredEnvVar(
    "STRIPE_SECRET_KEY",
    "Stripe secret key is required for webhook processing. Please set the STRIPE_SECRET_KEY environment variable.",
    true
  );
  const keyValidation = validateStripeSecretKey(stripeSecretKey);
  if (!keyValidation.valid && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: `Stripe configuration error: ${keyValidation.error || "Invalid key"}` },
      { status: 500 }
    );
  }
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: getStripeApiVersion(),
  });
  const webhookSecret =
    getStripeWebhookSecret() ||
    getRequiredEnvVar(
      "STRIPE_WEBHOOK_SECRET",
      "Stripe webhook secret is required for secure webhook processing. Please set the STRIPE_WEBHOOK_SECRET environment variable.",
      true
    );

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") || "";

  // Always verify webhook signatures, even in development
  // Use Stripe CLI for local testing: stripe listen --forward-to localhost:3000/api/stripe/webhook
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
      WEBHOOK_TOLERANCE
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      {
        error: "Webhook signature verification failed",
        message:
          error instanceof Error
            ? error.message
            : "Invalid signature or clock skew",
      },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handleSuccessfulPayment(paymentIntent, stripe);
        break;

      case "payment_intent.payment_failed":
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        await handleFailedPayment(failedPaymentIntent);
        break;

      case "payment_intent.requires_action":
        // Handle 3D Secure authentication requirement
        const actionRequiredIntent = event.data.object as Stripe.PaymentIntent;
        console.log(
          `Payment requires action (3D Secure): ${actionRequiredIntent.id}`
        );
        // Order status will be updated when payment completes via succeeded event
        break;

      case "payment_intent.canceled":
        const canceledIntent = event.data.object as Stripe.PaymentIntent;
        await handleCanceledPayment(canceledIntent);
        break;

      case "charge.refunded":
        const refundedCharge = event.data.object as Stripe.Charge;
        await handleRefund(refundedCharge);
        break;

      case "charge.dispute.created":
        const dispute = event.data.object as Stripe.Dispute;
        await handleDispute(dispute, stripe);
        break;

      default:
        // Log unhandled events for monitoring
        console.log(`Unhandled webhook event type: ${event.type}`);
        break;
    }
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    // Return 500 to trigger Stripe retry
    return NextResponse.json(
      {
        error: "Error processing webhook",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

// Function to handle successful payment
async function handleSuccessfulPayment(
  paymentIntent: Stripe.PaymentIntent,
  _stripe: Stripe
) {
  const paymentIntentId = paymentIntent.id;
  const orderIdFromMetadata = paymentIntent.metadata.orderId;
  const userEmail = paymentIntent.metadata.userEmail;

  try {
    const { db } = await import("@/lib/db");
    const { processDigitalBookOrder } = await import(
      "@/lib/services/digital-order-service"
    );

    // Look up order either by metadata or by stored Stripe intent ID
    const order =
      (orderIdFromMetadata
        ? await db.order.findUnique({
            where: { id: orderIdFromMetadata },
            include: { items: true, user: true, shippingAddress: true },
          })
        : null) ||
      (await db.order.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
        include: { items: true, user: true, shippingAddress: true },
      }));

    if (!order) {
      console.warn(
        `Payment succeeded but no order found for intent ${paymentIntentId}`
      );
      return;
    }

    const hasDigitalItems =
      order.items.length > 0 && order.items.every(item => item.isDigital);

    // Update payment status; only auto-complete digital-only orders
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        stripePaymentIntentId: paymentIntentId,
        ...(hasDigitalItems ? { status: "COMPLETED" } : {}),
      },
    });

    if (hasDigitalItems) {
      await processDigitalBookOrder(order.id);
    } else if (userEmail) {
      // For physical orders send confirmation email
      try {
        const { DatabaseTemplateService } = await import(
          "@/lib/email/database-template-service"
        );

        const orderNumberForEmail = order.orderNumber || order.id;

        const sendResult =
          await DatabaseTemplateService.sendOrderConfirmationEmail(
            userEmail,
            {
              customerName:
                order?.shippingAddress?.fullName ||
                order?.user?.name ||
                "Client",
              orderNumber: String(orderNumberForEmail),
              orderTotal: order.total,
              items: (order.items || []).map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              })),
              shippingAddress: order.shippingAddress || null,
            }
          );

        if (!sendResult.success) {
          console.error(
            `Failed to send order confirmation email via template service:`,
            sendResult.error
          );
        }
      } catch (emailError) {
        console.error(`Failed to send order confirmation email:`, emailError);
      }
    }
  } catch (error) {
    console.error(
      `Error processing successful payment for intent ${paymentIntentId}:`,
      error
    );
  }
}

// Function to handle failed payment
async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;
  const orderId = paymentIntent.metadata.orderId;
  const userEmail = paymentIntent.metadata.userEmail;

  try {
    const { db } = await import("@/lib/db");
    const order =
      (orderId
        ? await db.order.findUnique({ where: { id: orderId } })
        : null) ||
      (await db.order.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
      }));

    if (!order) {
      console.warn(
        `Payment failed but no order found for intent ${paymentIntentId}`
      );
      return;
    }

    // Update order status to "payment_failed" in database
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "FAILED",
        status: "CANCELLED",
      },
    });

    console.log(`Order ${order.id} marked as payment failed`);

    // Notify customer about failed payment if we have their email
    if (userEmail) {
      try {
        const { DatabaseTemplateService } = await import(
          "@/lib/email/database-template-service"
        );

        await DatabaseTemplateService.sendEmail(
          userEmail,
          "Payment Failed",
          `Your payment for order ${order.id} has failed. Please try again or contact support.`
        );
      } catch (emailError) {
        console.error(
          `Failed to send payment failure email to ${userEmail}:`,
          emailError
        );
      }
    }
  } catch (error) {
    console.error(
      `Error processing failed payment for order ${orderId || paymentIntentId}:`,
      error
    );
    throw error; // Re-throw to trigger webhook retry
  }
}

// Function to handle canceled payment
async function handleCanceledPayment(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;
  const orderId = paymentIntent.metadata.orderId;

  try {
    const { db } = await import("@/lib/db");
    const order =
      (orderId
        ? await db.order.findUnique({ where: { id: orderId } })
        : null) ||
      (await db.order.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
      }));

    if (!order) {
      console.warn(
        `Payment canceled but no order found for intent ${paymentIntentId}`
      );
      return;
    }

    await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "FAILED",
        status: "CANCELLED",
      },
    });

    console.log(`Order ${order.id} canceled due to payment cancellation`);
  } catch (error) {
    console.error(
      `Error processing canceled payment for order ${orderId || paymentIntentId}:`,
      error
    );
    throw error;
  }
}

// Function to handle refund
async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    console.warn("Refund charge missing payment_intent ID");
    return;
  }

  try {
    const { db } = await import("@/lib/db");

    // Find order by Stripe payment intent ID
    const order = await db.order.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
      },
    });

    if (order) {
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "REFUNDED",
        },
      });

      console.log(`Order ${order.id} marked as refunded`);

      // Optionally send refund confirmation email
      if (order.userId) {
        const user = await db.user.findUnique({
          where: { id: order.userId },
          select: { email: true },
        });

        if (user?.email) {
          try {
            const { DatabaseTemplateService } = await import(
              "@/lib/email/database-template-service"
            );

            await DatabaseTemplateService.sendEmail(
              user.email,
              "Refund Processed",
              `Your refund for order ${order.orderNumber} has been processed.`
            );
          } catch (emailError) {
            console.error(
              `Failed to send refund email to ${user.email}:`,
              emailError
            );
          }
        }
      }
    } else {
      console.warn(
        `No order found for refunded payment intent ${paymentIntentId}`
      );
    }
  } catch (error) {
    console.error(`Error processing refund for charge ${charge.id}:`, error);
    throw error;
  }
}

// Function to handle dispute
async function handleDispute(dispute: Stripe.Dispute, stripe: Stripe) {
  const chargeId = dispute.charge as string;

  if (!chargeId) {
    console.warn("Dispute missing charge ID");
    return;
  }

  try {
    // Retrieve the charge to get the payment intent
    const charge = await stripe.charges.retrieve(chargeId);
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      console.warn("Dispute charge missing payment_intent ID");
      return;
    }

    const { db } = await import("@/lib/db");

    // Find order by Stripe payment intent ID
    const order =
      (await db.order.findFirst({
        where: {
          stripePaymentIntentId: paymentIntentId,
        },
      })) ||
      (await db.order.findUnique({
        where: { id: dispute.metadata?.orderId || "" },
      }));

    if (order) {
      // Log dispute for admin review
      console.error(
        `DISPUTE CREATED: Order ${order.id} (${order.orderNumber}) - Dispute ID: ${dispute.id}, Amount: ${dispute.amount}, Reason: ${dispute.reason}`
      );

      // Update order status to indicate dispute
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "DISPUTED",
          // Keep order status as-is, but payment is disputed
        },
      });

      // TODO: Send alert to admin team about the dispute
    } else {
      console.warn(
        `No order found for disputed payment intent ${paymentIntentId}`
      );
    }
  } catch (error) {
    console.error(`Error processing dispute ${dispute.id}:`, error);
    throw error;
  }
}
