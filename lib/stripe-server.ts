import Stripe from "stripe";

import { getRequiredEnvVar } from "./env";
import {
  getStripeApiVersion,
  validateStripeSecretKey,
} from "./stripe-config";

// Initialize Stripe with the secret key from environment variable
// Throw an error if the key is not set in production
const stripeSecretKey = getRequiredEnvVar(
  "STRIPE_SECRET_KEY",
  "Stripe secret key is required for payment processing. Please set the STRIPE_SECRET_KEY environment variable.",
  true // Allow development placeholder in non-production environments
);

// Validate secret key format
const keyValidation = validateStripeSecretKey(stripeSecretKey);
if (!keyValidation.valid && process.env.NODE_ENV === "production") {
  throw new Error(
    `Stripe configuration error: ${keyValidation.error || "Invalid key"}`
  );
}

// Create a Stripe instance with consistent API version
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: getStripeApiVersion(),
});

export default stripe;
