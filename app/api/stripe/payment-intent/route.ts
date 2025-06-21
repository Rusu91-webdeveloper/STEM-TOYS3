import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequiredEnvVar } from "@/lib/env";

// Initialize Stripe with proper error handling for required keys
const stripeSecretKey = getRequiredEnvVar(
  "STRIPE_SECRET_KEY",
  "Stripe secret key is required for payment processing. Please set the STRIPE_SECRET_KEY environment variable.",
  true // Allow development placeholder in non-production environments
);

const stripe = new Stripe(stripeSecretKey);

export async function POST(request: Request) {
  try {
    const {
      amount,
      currency = "usd",
      payment_method_types = ["card"],
    } = await request.json();

    // Validate the request
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types,
      metadata: {
        integration_check: "accept_a_payment",
      },
    });

    // Return the client secret
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Error creating payment intent" },
      { status: 500 }
    );
  }
}
