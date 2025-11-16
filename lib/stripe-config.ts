/**
 * Centralized Stripe configuration utility
 * Ensures consistent currency, API version, and environment handling across all Stripe integrations
 */

/**
 * Get the configured Stripe currency (defaults to RON for Romania)
 */
export function getStripeCurrency(): string {
  const currency =
    process.env.STRIPE_DEFAULT_CURRENCY ||
    process.env.NEXT_PUBLIC_STRIPE_CURRENCY ||
    "ron";
  return currency.toLowerCase();
}

/**
 * Get the Stripe API version to use (latest stable as of 2024)
 * All Stripe SDK instances should use this version for consistency
 * 
 * Note: Stripe API versions follow the format YYYY-MM-DD.codename
 * Valid versions can be found at: https://stripe.com/docs/upgrades#api-changelog
 */
export function getStripeApiVersion(): string {
  // Use a valid Stripe API version
  // 2024-09-30.acacia is a confirmed valid version
  // If you need a newer version, check Stripe's API changelog
  return "2024-09-30.acacia";
}

/**
 * Check if Stripe is enabled via environment variables
 */
export function isStripeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";
}

/**
 * Validate Stripe secret key format
 * In production, ensure we're using live keys (sk_live_*)
 */
export function validateStripeSecretKey(key: string | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!key) {
    return { valid: false, error: "Stripe secret key is not set" };
  }

  if (process.env.NODE_ENV === "production") {
    if (!key.startsWith("sk_live_")) {
      return {
        valid: false,
        error:
          "Production environment requires live Stripe keys (sk_live_*)",
      };
    }
  }

  if (!key.startsWith("sk_")) {
    return {
      valid: false,
      error: "Invalid Stripe secret key format (must start with sk_)",
    };
  }

  return { valid: true };
}

/**
 * Get Stripe publishable key with validation
 */
export function getStripePublishableKey(): string | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    return null;
  }

  if (!key.startsWith("pk_")) {
    console.error(
      "Invalid Stripe publishable key format (must start with pk_)"
    );
    return null;
  }

  return key;
}

/**
 * Get Stripe webhook secret
 */
export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET || null;
}

