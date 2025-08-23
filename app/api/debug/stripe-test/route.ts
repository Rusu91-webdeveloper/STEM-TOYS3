import { NextResponse } from "next/server";
import { loadStripe } from "@stripe/stripe-js";

export async function GET() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    return NextResponse.json({
      success: false,
      error: "No publishable key found",
      message: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set"
    });
  }

  try {
    // Try to load Stripe with the key
    const stripe = await loadStripe(publishableKey);
    
    if (!stripe) {
      return NextResponse.json({
        success: false,
        error: "Stripe returned null",
        message: "loadStripe() returned null - this usually means the key is invalid or there's a network issue"
      });
    }

    return NextResponse.json({
      success: true,
      message: "Stripe loaded successfully",
      stripeObject: "Stripe object created successfully"
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to load Stripe",
      details: error instanceof Error ? error.stack : "No stack trace available"
    });
  }
}
