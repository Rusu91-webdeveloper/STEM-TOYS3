import Stripe from "stripe";

import { getRequiredEnvVar } from "./env";

// Initialize Stripe with the secret key from environment variable
// Throw an error if the key is not set in production
const stripeSecretKey = getRequiredEnvVar(
  "STRIPE_SECRET_KEY",
  "Stripe secret key is required for payment processing. Please set the STRIPE_SECRET_KEY environment variable.",
  true // Allow development placeholder in non-production environments
);

// Create a Stripe instance
const stripe = new Stripe(stripeSecretKey);

export default stripe;
