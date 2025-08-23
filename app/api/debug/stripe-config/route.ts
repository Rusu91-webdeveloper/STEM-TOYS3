import { NextResponse } from "next/server";

export async function GET() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const stripeConfig = {
    publishableKey: publishableKey ? `${publishableKey.substring(0, 10)}...` : null,
    secretKey: secretKey ? `${secretKey.substring(0, 10)}...` : null,
    webhookSecret: webhookSecret ? `${webhookSecret.substring(0, 10)}...` : null,
    environment: process.env.NODE_ENV,
    hasPublishableKey: !!publishableKey,
    hasSecretKey: !!secretKey,
    hasWebhookSecret: !!webhookSecret,
    publishableKeyStartsWithPk: publishableKey?.startsWith("pk_"),
    secretKeyStartsWithSk: secretKey?.startsWith("sk_"),
    webhookSecretStartsWithWhsec: webhookSecret?.startsWith("whsec_"),
    publishableKeyLength: publishableKey?.length,
    secretKeyLength: secretKey?.length,
    webhookSecretLength: webhookSecret?.length,
    // Check if keys look valid
    publishableKeyValid: publishableKey?.startsWith("pk_") && publishableKey.length > 50,
    secretKeyValid: secretKey?.startsWith("sk_") && secretKey.length > 50,
    webhookSecretValid: webhookSecret?.startsWith("whsec_") && webhookSecret.length > 20,
  };

  return NextResponse.json({
    stripeConfig,
    message: "Stripe configuration diagnostic",
    timestamp: new Date().toISOString(),
  });
}
