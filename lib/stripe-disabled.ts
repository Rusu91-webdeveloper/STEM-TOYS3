import { Stripe } from "@stripe/stripe-js";

// Disabled Stripe configuration for when Stripe CDN is blocked
export const getDisabledStripe = (): Promise<Stripe | null> => {
  console.warn("Stripe is disabled due to network restrictions");
  return Promise.resolve(null);
};

// Check if Stripe should be disabled based on environment
export const shouldDisableStripe = (): boolean => {
  // Enable Stripe in all environments now that we have secure client-side loading
  return false;
};
