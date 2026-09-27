import { createHash } from "crypto";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "@/lib/auth";
import {
  CheckoutPricingError,
  resolveCheckoutPricing,
} from "@/lib/checkout/authoritative-pricing";
import { createPaymentIntentRequestSchema } from "@/lib/checkout/create-payment-intent-request";
import { guestGuaranteePolicyRejection } from "@/lib/checkout/guest-guarantee-policy-gate";
import {
  isPaymentIntentActor,
  resolvePaymentIntentActor,
} from "@/lib/checkout/payment-intent-access";
import {
  PaymentIntentAlreadyUsedError,
  PaymentIntentOwnershipError,
} from "@/lib/checkout/payment-intent-ownership";
import {
  reuseOrCreatePaymentIntent,
  sanitizePaymentIntentMetadata,
} from "@/lib/checkout/stripe-payment-intent";
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
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch (error) {
      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        );
      }
      throw error;
    }
    const parsedBody = createPaymentIntentRequestSchema.safeParse(rawBody);
    const requestedFlow =
      rawBody &&
      typeof rawBody === "object" &&
      "metadata" in rawBody &&
      rawBody.metadata &&
      typeof rawBody.metadata === "object" &&
      "paymentFlow" in rawBody.metadata
        ? String(rawBody.metadata.paymentFlow)
        : null;

    const invalidPayloadResponse = NextResponse.json(
      {
        success: false,
        error: "Invalid payload",
        details: parsedBody.success ? undefined : parsedBody.error.flatten(),
      },
      { status: 400 }
    );
    const actorResult = await resolvePaymentIntentActor({
      request,
      hasSessionUser: Boolean(session?.user?.id),
      sessionUserId: session?.user?.id,
      sessionEmail: session?.user?.email,
      requestedFlow,
      payloadValid: parsedBody.success,
      guestEmail: parsedBody.success ? parsedBody.data.guestEmail : null,
      hasCheckoutContext: parsedBody.success
        ? Boolean(parsedBody.data.checkoutContext)
        : false,
      invalidPayloadResponse,
    });
    if (!isPaymentIntentActor(actorResult)) return actorResult;
    if (!parsedBody.success) return invalidPayloadResponse;
    const actor = actorResult;

    const {
      amount,
      paymentIntentId,
      metadata,
      checkoutAttemptId,
      checkoutContext,
    } = parsedBody.data;

    const paymentFlow =
      actor.kind === "guest"
        ? "cod_guarantee"
        : typeof metadata?.paymentFlow === "string"
          ? metadata.paymentFlow
          : null;

    let resolvedAmount = amount;
    let pricedOrderTotal: number | null = null;
    if (checkoutContext) {
      try {
        const pricing = await resolveCheckoutPricing({
          userId: actor.kind === "user" ? actor.userId : "",
          items: checkoutContext.items,
          shippingMethodId: checkoutContext.shippingMethodId,
          couponCode: checkoutContext.couponCode || undefined,
          paymentMethod: checkoutContext.paymentMethod,
        });

        pricedOrderTotal = pricing.orderTotal;
        resolvedAmount = Math.round(
          (paymentFlow === "cod_guarantee"
            ? pricing.codGuaranteeAmount
            : pricing.orderTotal) * 100
        );
      } catch (error) {
        if (error instanceof CheckoutPricingError) {
          return NextResponse.json(
            {
              success: false,
              error: error.code,
              message: error.message,
              details: error.details,
            },
            { status: error.status }
          );
        }
        throw error;
      }
    }

    if (actor.kind === "guest") {
      if (!checkoutContext || pricedOrderTotal === null) {
        return NextResponse.json(
          {
            success: false,
            error: "CHECKOUT_CONTEXT_REQUIRED",
            message:
              "Checkout context is required to price a guest COD guarantee.",
          },
          { status: 400 }
        );
      }
      const policyRejection = await guestGuaranteePolicyRejection({
        guestEmail: actor.email,
        orderTotal: pricedOrderTotal,
        shippingMethodId: checkoutContext.shippingMethodId,
        recipientType: checkoutContext.recipientType,
        phone: checkoutContext.phone,
      });
      if (policyRejection) return policyRejection;
    }

    if (resolvedAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_PAYMENT_AMOUNT",
          message:
            "Payment amount must be greater than zero for this checkout flow.",
        },
        { status: 400 }
      );
    }

    const sanitizedMetadata = sanitizePaymentIntentMetadata(metadata);
    if (actor.kind === "guest") {
      delete sanitizedMetadata.userId;
    }

    const baseMetadata = {
      ...sanitizedMetadata,
      ...(actor.kind === "user"
        ? { userId: actor.userId, userEmail: actor.email }
        : {
            guestEmail: actor.email,
            userEmail: actor.email,
            paymentFlow: "cod_guarantee",
          }),
      ...(checkoutAttemptId ? { checkoutAttemptId } : {}),
    };

    const actorRef =
      actor.kind === "user"
        ? { kind: "user" as const, userId: actor.userId }
        : { kind: "guest" as const, email: actor.email };
    const actorKey =
      actor.kind === "user" ? actor.userId : `guest:${actor.email}`;
    const idempotencyKey = paymentIntentId
      ? `pi:${paymentIntentId}`
      : checkoutAttemptId
        ? `checkout:${checkoutAttemptId}`
        : createHash("sha256")
            .update(`${actorKey}:${Date.now()}:${Math.random()}`)
            .digest("hex");

    const receiptEmail = actor.email || undefined;
    const createParams: Stripe.PaymentIntentCreateParams = {
      amount: resolvedAmount,
      currency: normalizedCurrency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "always",
      },
      metadata: baseMetadata,
      // Automatically send Stripe receipt to customer's email when payment succeeds
      receipt_email: receiptEmail,
      // Use manual capture - funds are authorized (held) but not captured until order is created
      // This prevents charging customers who cancel before completing the order
      capture_method: "manual",
    };

    let paymentIntent: Stripe.PaymentIntent;

    if (paymentIntentId) {
      paymentIntent = await reuseOrCreatePaymentIntent(
        stripe,
        normalizedCurrency,
        paymentIntentId,
        resolvedAmount,
        baseMetadata,
        createParams,
        idempotencyKey,
        actorRef,
        receiptEmail
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
      amount: resolvedAmount,
    });
  } catch (error) {
    if (
      error instanceof PaymentIntentOwnershipError ||
      error instanceof PaymentIntentAlreadyUsedError
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        { status: error.status }
      );
    }
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
