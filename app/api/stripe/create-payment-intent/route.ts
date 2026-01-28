import { createHash } from "crypto";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getRequiredEnvVar } from "@/lib/env";
import {
  getStripeApiVersion,
  getStripeCurrency,
  validateStripeSecretKey,
} from "@/lib/stripe-config";

// IMPORTANT:
// Avoid initializing Stripe and validating keys at module import time.
// Doing so can break Next.js production builds because the build step imports route modules.
// We initialize and validate within the request handler instead.

const createRequestSchema = z.object({
  amount: z.number().int().positive(),
  paymentIntentId: z.string().optional(),
  checkoutAttemptId: z.string().min(1).optional(),
  currency: z.string().optional(),
  metadata: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});

const REUSABLE_STATUSES: Stripe.PaymentIntent.Status[] = [
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "processing",
];

// Terminal states that cannot be reused or confirmed
const TERMINAL_STATUSES: Stripe.PaymentIntent.Status[] = [
  "succeeded",
  "canceled",
  "payment_failed",
];

export async function POST(request: NextRequest) {
  try {
    // Initialize Stripe lazily at request time to prevent build-time failures
    const stripeSecretKey = getRequiredEnvVar(
      "STRIPE_SECRET_KEY",
      "Stripe secret key is required for payment processing. Please set the STRIPE_SECRET_KEY environment variable.",
      true
    );
    const keyValidation = validateStripeSecretKey(stripeSecretKey);
    if (!keyValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: `Stripe configuration error: ${
            keyValidation.error || "Invalid key"
          }`,
        },
        { status: 500 }
      );
    }
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: getStripeApiVersion(),
    });
    const normalizedCurrency = getStripeCurrency();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const parsedBody = createRequestSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payload",
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { amount, paymentIntentId, metadata, checkoutAttemptId } =
      parsedBody.data;

    const baseMetadata = {
      ...sanitizeMetadata(metadata),
      userId: session.user.id,
      userEmail: session.user.email || "",
      ...(checkoutAttemptId ? { checkoutAttemptId } : {}),
    };

    const idempotencyKey = paymentIntentId
      ? `pi:${paymentIntentId}`
      : checkoutAttemptId
        ? `checkout:${checkoutAttemptId}`
        : createHash("sha256")
            .update(`${session.user.id}:${Date.now()}:${Math.random()}`)
            .digest("hex");

    const createParams: Stripe.PaymentIntentCreateParams = {
      amount,
      currency: normalizedCurrency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "always",
      },
      metadata: baseMetadata,
      // Automatically send Stripe receipt to customer's email when payment succeeds
      receipt_email: session.user.email || undefined,
    };

    let paymentIntent: Stripe.PaymentIntent;

    if (paymentIntentId) {
      paymentIntent = await reuseOrCreatePaymentIntent(
        stripe,
        normalizedCurrency,
        paymentIntentId,
        amount,
        baseMetadata,
        createParams,
        idempotencyKey,
        session.user.email || undefined
      );
    } else {
      paymentIntent = await stripe.paymentIntents.create(createParams, {
        idempotencyKey,
      });
    }

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
        error:
          error instanceof Error
            ? error.message
            : "Failed to create payment intent",
      },
      { status: 500 }
    );
  }
}

async function reuseOrCreatePaymentIntent(
  stripe: Stripe,
  normalizedCurrency: string,
  paymentIntentId: string,
  amount: number,
  metadata: Record<string, string>,
  createParams: Stripe.PaymentIntentCreateParams,
  idempotencyKey: string,
  receiptEmail?: string
): Promise<Stripe.PaymentIntent> {
  try {
    const existing = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Explicitly reject PaymentIntents in terminal states
    if (TERMINAL_STATUSES.includes(existing.status)) {
      console.log(
        `PaymentIntent ${paymentIntentId} is in terminal state (${existing.status}). Creating new PaymentIntent.`
      );
      return stripe.paymentIntents.create(createParams, { idempotencyKey });
    }

    // Only reuse PaymentIntents in reusable states
    if (
      existing.currency === normalizedCurrency &&
      REUSABLE_STATUSES.includes(existing.status)
    ) {
      return stripe.paymentIntents.update(paymentIntentId, {
        amount,
        metadata,
        // Update receipt email in case user changed
        receipt_email: receiptEmail,
      });
    }

    // If status is not reusable and not terminal, create a new one
    console.log(
      `PaymentIntent ${paymentIntentId} has status ${existing.status} which is not reusable. Creating new PaymentIntent.`
    );
  } catch (intentError) {
    console.warn(
      `Unable to reuse payment intent ${paymentIntentId}:`,
      intentError
    );
  }

  return stripe.paymentIntents.create(createParams, { idempotencyKey });
}

function sanitizeMetadata(
  metadata?: Record<string, string | number | boolean>
) {
  if (!metadata) {
    return {};
  }

  return Object.entries(metadata).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    },
    {}
  );
}
