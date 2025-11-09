import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});
const configuredCurrency =
  process.env.STRIPE_DEFAULT_CURRENCY ||
  process.env.NEXT_PUBLIC_STRIPE_CURRENCY ||
  "ron";
const normalizedCurrency = configuredCurrency.toLowerCase();

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      amount,
      currency,
      metadata = {},
    }: {
      amount: number | string;
      currency?: string;
      metadata?: Record<string, string>;
    } = body;

    const parsedAmount = Number(amount);
    const amountInMinorUnits = Math.round(parsedAmount);

    // Validate input – expect caller to provide minor units already
    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      Math.abs(amountInMinorUnits - parsedAmount) > 0.00001
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    const incomingCurrency =
      typeof currency === "string" ? currency.toLowerCase() : null;
    if (
      incomingCurrency &&
      incomingCurrency !== normalizedCurrency
    ) {
      console.warn(
        `Ignoring mismatched currency "${incomingCurrency}" and forcing Stripe currency "${normalizedCurrency}".`
      );
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInMinorUnits,
      currency: normalizedCurrency,
      metadata: {
        ...(typeof metadata === "object" ? metadata : {}),
        userId: session.user.id,
        userEmail: session.user.email || "",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to create payment intent" 
      },
      { status: 500 }
    );
  }
}
