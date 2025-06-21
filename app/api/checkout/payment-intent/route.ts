import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { cookies } from "next/headers";
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
});

// POST /api/checkout/payment-intent - Create a Stripe payment intent
export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();

    // Validate the request
    const { amount } = paymentIntentSchema.parse(body);

    // Create metadata including userId if available
    const metadata: Record<string, string> = {
      integration_check: "nextcommerce_payment",
    };

    // Only add userId if it exists
    if (session?.user?.id) {
      metadata.userId = session.user.id.toString();
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      // Verify your integration by passing this to metadata
      metadata,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
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
