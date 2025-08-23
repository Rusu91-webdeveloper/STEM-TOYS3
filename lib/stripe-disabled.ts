import { Stripe } from "@stripe/stripe-js";

// Disabled Stripe configuration for when Stripe CDN is blocked
export const getDisabledStripe = (): Promise<Stripe | null> => {
  console.warn("Stripe is disabled due to network restrictions");
  return Promise.resolve(null);
};

// Check if Stripe should be disabled based on environment
export const shouldDisableStripe = (): boolean => {
  // Disable client-side Stripe in production due to CDN issues
  // But enable server-side Stripe processing
  if (process.env.NODE_ENV === "production") {
    return true; // Disable client-side Stripe Elements
  }
  return false;
};
