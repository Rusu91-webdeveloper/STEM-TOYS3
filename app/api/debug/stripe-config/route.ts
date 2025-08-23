import { NextResponse } from "next/server";

export async function GET() {
  const stripeConfig = {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY ? "SET" : "NOT SET",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? "SET" : "NOT SET",
    environment: process.env.NODE_ENV,
    hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    publishableKeyStartsWithPk: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_"),
  };

  return NextResponse.json({
    stripeConfig,
    message: "Stripe configuration diagnostic",
    timestamp: new Date().toISOString(),
  });
}
