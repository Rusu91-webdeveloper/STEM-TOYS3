import { loadStripe, Stripe } from "@stripe/stripe-js";
import { getStripeProduction } from "./stripe-secure-production";
import { getStripeBypassSW } from "./stripe-bypass-sw";
import { getStripeSecure } from "./stripe-secure-client";
import { getStripeWithFallback, testStripeConnectivity } from "./stripe-fallback";
import { loadStripeWithoutAPIValidation } from "./stripe-cdn-fix";
import { createCompatibleMockStripe } from "./stripe-mock";
import { getDisabledStripe, shouldDisableStripe } from "./stripe-disabled";

// Load the Stripe public key from environment variable
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Create a promise that resolves to the Stripe object
let stripePromise: Promise<Stripe | null>;

// Function to get the Stripe promise
export const getStripe = () => {
  if (!stripePromise) {
    // Check if Stripe should be disabled
    if (shouldDisableStripe()) {
      console.warn("Stripe is disabled in this environment");
      return getDisabledStripe();
    }

    // Check if the key is available
    if (!stripePublicKey) {
      console.error(
        "Stripe publishable key is not set. Payment functionality will not work correctly."
      );
      // Return a rejected promise in production
      if (process.env.NODE_ENV === "production") {
        return Promise.reject(
          new Error("Payment configuration error. Please contact support.")
        );
      }
      // In development, we'll continue with a warning and return null
      console.warn("Using dummy Stripe key for development only");
      return Promise.resolve(null);
    }

    // Validate the key format
    if (!stripePublicKey.startsWith("pk_")) {
      console.error(
        "Invalid Stripe publishable key format. Keys should start with 'pk_'"
      );
      if (process.env.NODE_ENV === "production") {
        return Promise.reject(
          new Error("Payment configuration error. Please contact support.")
        );
      }
      // In development, continue with a warning
      console.warn("Using potentially invalid Stripe key");
    }

    // Initialize Stripe with production-first approach
    console.log("Attempting to load Stripe for production with real payments...");
    
    stripePromise = getStripeProduction().then(async (stripe) => {
      if (stripe) {
        console.log("✅ Stripe loaded successfully for production - REAL PAYMENTS SECURE");
        return stripe;
      }
      
      // If production loading failed, try service worker bypass
      console.log("Production loading failed, trying service worker bypass...");
      const bypassStripe = await getStripeBypassSW();
      if (bypassStripe) {
        console.log("Stripe loaded with service worker bypass");
        return bypassStripe;
      }
      
      // If service worker bypass failed, try secure client-side approach
      console.log("Service worker bypass failed, trying secure client-side approach...");
      const secureStripe = await getStripeSecure();
      if (secureStripe) {
        console.log("Stripe loaded with secure client-side approach");
        return secureStripe;
      }
      
      // If secure approach failed, try API bypass strategies
      console.log("Secure approach failed, trying API bypass strategies...");
      const apiBypassStripe = await loadStripeWithoutAPIValidation(stripePublicKey);
      if (apiBypassStripe) {
        console.log("Stripe loaded with API bypass strategy");
        return apiBypassStripe;
      }
      
      // If API bypass failed, try the original fallback
      console.log("API bypass failed, trying original fallback strategies...");
      const fallbackStripe = await getStripeWithFallback(stripePublicKey);
      if (fallbackStripe) {
        console.log("Stripe loaded with original fallback strategy");
        return fallbackStripe;
      }
      
      // If all strategies failed, provide a critical error for production
      console.error("❌ CRITICAL: All Stripe loading strategies failed");
      console.error("⚠️ WARNING: Real payments will NOT be secure!");
      console.error("This indicates the service worker is blocking all CDN requests");
      
      if (process.env.NODE_ENV === "production") {
        // In production, DO NOT create mock - this is critical
        console.error("🚨 CRITICAL: Cannot load Stripe for production");
        console.error("🚨 Real payments will be blocked by Stripe");
        return null; // Return null instead of mock for production
      }
      
      // Only in development, create mock for testing
      console.warn("Creating compatible mock Stripe for development testing only");
      return createCompatibleMockStripe();
    }).catch((error) => {
      console.error("Failed to load Stripe for production:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        keyPrefix: stripePublicKey.substring(0, 10),
        keyLength: stripePublicKey.length
      });
      
      if (process.env.NODE_ENV === "production") {
        // In production, DO NOT create mock - this is critical
        console.error("🚨 CRITICAL: Failed to load Stripe for production");
        console.error("🚨 Real payments will be blocked by Stripe");
        return null;
      }
      
      // Only in development, create mock for testing
      console.warn("Creating compatible mock Stripe for development testing only");
      return createCompatibleMockStripe();
    });
  }
  return stripePromise;
};
