import { loadStripe, Stripe } from "@stripe/stripe-js";

// Load the Stripe public key from environment variable
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Create a promise that resolves to the Stripe object
let stripePromise: Promise<Stripe | null>;

// Function to get the Stripe promise
export const getStripe = () => {
  if (!stripePromise) {
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

    // Initialize Stripe with the public key and better error handling
    console.log("Attempting to load Stripe with key:", stripePublicKey.substring(0, 10) + "...");
    
    stripePromise = loadStripe(stripePublicKey, {
      // Add Stripe configuration options for better compatibility
      apiVersion: "2023-10-16", // Use latest stable API version
      betas: ["elements_enable_deferred_intent_beta_1"], // Enable latest features
    }).then((stripe) => {
      console.log("Stripe loaded successfully:", !!stripe);
      return stripe;
    }).catch((error) => {
      console.error("Failed to load Stripe:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        keyPrefix: stripePublicKey.substring(0, 10),
        keyLength: stripePublicKey.length
      });
      // In production, we want to fail fast if Stripe can't load
      if (process.env.NODE_ENV === "production") {
        throw new Error("Failed to initialize payment system. Please refresh the page.");
      }
      return null;
    });
  }
  return stripePromise;
};
