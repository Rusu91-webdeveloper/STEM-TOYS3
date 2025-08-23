import { Stripe } from "@stripe/stripe-js";

// Disabled Stripe configuration for when Stripe CDN is blocked
export const getDisabledStripe = (): Promise<Stripe | null> => {
  console.warn("Stripe is disabled due to network restrictions");
  return Promise.resolve(null);
};

// Check if Stripe should be disabled based on environment
export const shouldDisableStripe = (): boolean => {
  // Disable Stripe in production if we know it fails
  if (process.env.NODE_ENV === "production") {
    // You can add additional checks here if needed
    return true;
  }
  return false;
};
