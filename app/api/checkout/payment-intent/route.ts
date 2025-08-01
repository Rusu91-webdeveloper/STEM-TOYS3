import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getRequiredEnvVar } from "@/lib/env";

// Initialize Stripe with proper error handling for required keys
const stripeSecretKey = getRequiredEnvVar(
  "STRIPE_SECRET_KEY",
  "Stripe secret key is required for payment processing. Please set the STRIPE_SECRET_KEY environment variable.",
  true // Allow development placeholder in non-production environments
);

const stripe = new Stripe(stripeSecretKey);

// Schema for validating the request body
const paymentIntentSchema = z.object({
  amount: z.number().positive(),
  orderId: z.string().optional(), // Accept orderId if available
});

// POST /api/checkout/payment-intent - Create a Stripe payment intent
export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();

    // Validate the request
    const { amount, orderId } = paymentIntentSchema.parse(body);

    // Create metadata including userId and orderId if available
    const metadata: Record<string, string> = {
      integration_check: "nextcommerce_payment",
    };
    if (session?.user?.id) {
      metadata.userId = session.user.id.toString();
    }
    if (orderId) {
      metadata.orderId = orderId;
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id, // Return paymentIntentId for order creation
    });
  } catch (error) {
    console.error("Payment intent error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
