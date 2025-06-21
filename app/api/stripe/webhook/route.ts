import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { getRequiredEnvVar } from "@/lib/env";

// Initialize Stripe with proper error handling for required keys
const stripeSecretKey = getRequiredEnvVar(
  "STRIPE_SECRET_KEY",
  "Stripe secret key is required for webhook processing. Please set the STRIPE_SECRET_KEY environment variable.",
  true // Allow development placeholder in non-production environments
);

const stripe = new Stripe(stripeSecretKey);

const webhookSecret = getRequiredEnvVar(
  "STRIPE_WEBHOOK_SECRET",
  "Stripe webhook secret is required for secure webhook processing. Please set the STRIPE_WEBHOOK_SECRET environment variable.",
  true // Allow development placeholder in non-production environments
);

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") || "";

  // In development, simulate a successful webhook response
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ received: true });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // Handle successful payment (update order status, send confirmation email, etc.)
      await handleSuccessfulPayment(paymentIntent);
      break;

    case "payment_intent.payment_failed":
      const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
      // Handle failed payment (notify customer, update order status, etc.)
      await handleFailedPayment(failedPaymentIntent);
      break;

    default:
      // Unhandled event type
      break;
  }

  return NextResponse.json({ received: true });
}

// Function to handle successful payment
async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  // Extract order ID from metadata if available
  const orderId = paymentIntent.metadata.orderId;
  const userEmail = paymentIntent.metadata.userEmail;

  if (orderId) {
    try {
      // Import the database and digital order service
      const { db } = await import("@/lib/db");
      const { processDigitalBookOrder } = await import(
        "@/lib/services/digital-order-service"
      );

      // Update order payment status in database
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "COMPLETED", // For digital products, complete immediately
        },
      });

      // Get order with includes for processing
      const updatedOrder = (await db.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          user: true,
        },
      })) as any;

      if (!updatedOrder) {
        throw new Error(`Order not found after update: ${orderId}`);
      }

      // Order updated to paid status

      // Check if order contains digital books
      const digitalItems = await db.orderItem.findMany({
        where: {
          orderId: orderId,
          isDigital: true,
        },
      });

      const hasDigitalBooks = digitalItems.length > 0;

      if (hasDigitalBooks) {
        // Process digital book delivery
        await processDigitalBookOrder(orderId);
      } else {
        // For physical products, send regular order confirmation
        if (userEmail) {
          try {
            // Send regular order confirmation email via Brevo
            await fetch(
              `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/email/brevo`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  type: "orderConfirmation",
                  data: {
                    to: userEmail,
                    order: updatedOrder,
                    user: updatedOrder.user,
                  },
                }),
              }
            );

            // Order confirmation email sent
          } catch (emailError) {
            console.error(
              `Failed to send order confirmation email:`,
              emailError
            );
          }
        }
      }
    } catch (error) {
      console.error(
        `Error processing successful payment for order ${orderId}:`,
        error
      );
    }
  }
}

// Function to handle failed payment
async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  const userEmail = paymentIntent.metadata.userEmail;

  if (orderId) {
    // Update order status to "payment_failed" in database
    // TODO: Implement database update for failed payment

    // Notify customer about failed payment if we have their email
    if (userEmail) {
      // Send an email notification about the failed payment
      // TODO: Implement email notification for failed payment
    }
  }
}
