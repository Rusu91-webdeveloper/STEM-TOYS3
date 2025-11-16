import Stripe from "stripe";

import { getRequiredEnvVar } from "./env";
import {
  getStripeApiVersion,
  validateStripeSecretKey,
} from "./stripe-config";

let cachedStripeClient: Stripe | null = null;
let cachedSecretKey: string | null = null;

/**
 * Lazily initialize a Stripe server client.
 * We only validate and create the client when it is actually needed by a request.
 */
export function getStripeServerClient(): Stripe {
  const stripeSecretKey = getRequiredEnvVar(
    "STRIPE_SECRET_KEY",
    "Stripe secret key is required for payment processing. Please set the STRIPE_SECRET_KEY environment variable.",
    true // Allow development placeholder in non-production environments
  );

  if (cachedStripeClient && cachedSecretKey === stripeSecretKey) {
    return cachedStripeClient;
  }

  const keyValidation = validateStripeSecretKey(stripeSecretKey);
  if (!keyValidation.valid) {
    throw new Error(
      `Stripe configuration error: ${keyValidation.error || "Invalid key"}`
    );
  }

  cachedStripeClient = new Stripe(stripeSecretKey, {
    apiVersion: getStripeApiVersion(),
  });
  cachedSecretKey = stripeSecretKey;

  return cachedStripeClient;
}
