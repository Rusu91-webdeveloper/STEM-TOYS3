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

const stripeSecretKey = getRequiredEnvVar(
  "STRIPE_SECRET_KEY",
  "Stripe secret key is required for payment processing. Please set the STRIPE_SECRET_KEY environment variable.",
  true
);

// Validate secret key format
const keyValidation = validateStripeSecretKey(stripeSecretKey);
if (!keyValidation.valid) {
  throw new Error(
    `Stripe configuration error: ${keyValidation.error || "Invalid key"}`
  );
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: getStripeApiVersion(),
});

const normalizedCurrency = getStripeCurrency();

const createRequestSchema = z.object({
  amount: z.number().int().positive(),
  paymentIntentId: z.string().optional(),
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

export async function POST(request: NextRequest) {
  try {
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

    const { amount, paymentIntentId, metadata } = parsedBody.data;

    const baseMetadata = {
      ...sanitizeMetadata(metadata),
      userId: session.user.id,
      userEmail: session.user.email || "",
    };

    const idempotencyKey = paymentIntentId
      ? paymentIntentId
      : createHash("sha256")
          .update(`${session.user.id}:${amount}:${normalizedCurrency}`)
          .digest("hex");

    const createParams: Stripe.PaymentIntentCreateParams = {
      amount,
      currency: normalizedCurrency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "always",
      },
      metadata: baseMetadata,
    };

    let paymentIntent: Stripe.PaymentIntent;

    if (paymentIntentId) {
      paymentIntent = await reuseOrCreatePaymentIntent(
        paymentIntentId,
        amount,
        baseMetadata,
        createParams,
        idempotencyKey
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
  paymentIntentId: string,
  amount: number,
  metadata: Record<string, string>,
  createParams: Stripe.PaymentIntentCreateParams,
  idempotencyKey: string
): Promise<Stripe.PaymentIntent> {
  try {
    const existing = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (
      existing.currency === normalizedCurrency &&
      REUSABLE_STATUSES.includes(existing.status)
    ) {
      return stripe.paymentIntents.update(paymentIntentId, {
        amount,
        metadata,
      });
    }
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
