import { loadStripe, Stripe } from "@stripe/stripe-js";
import { getStripeWithFallback, testStripeConnectivity } from "./stripe-fallback";

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

    // Initialize Stripe with fallback strategies
    console.log("Attempting to load Stripe with key:", stripePublicKey.substring(0, 10) + "...");
    
    stripePromise = getStripeWithFallback(stripePublicKey).then(async (stripe) => {
      if (stripe) {
        console.log("Stripe loaded successfully with fallback strategy");
        return stripe;
      }
      
      // If all strategies failed, test connectivity
      console.log("Testing Stripe CDN connectivity...");
      const isConnectable = await testStripeConnectivity();
      
      if (!isConnectable) {
        console.error("Stripe CDN is not accessible - network connectivity issue");
        if (process.env.NODE_ENV === "production") {
          throw new Error("Network connectivity issue with payment system. Please check your internet connection and try again.");
        }
      } else {
        console.error("Stripe CDN is accessible but loadStripe still returns null");
        if (process.env.NODE_ENV === "production") {
          throw new Error("Payment system configuration issue. Please contact support.");
        }
      }
      
      return null;
    }).catch((error) => {
      console.error("Failed to load Stripe with fallback:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        keyPrefix: stripePublicKey.substring(0, 10),
        keyLength: stripePublicKey.length
      });
      
      if (process.env.NODE_ENV === "production") {
        throw new Error("Failed to initialize payment system. Please refresh the page.");
      }
      return null;
    });
  }
  return stripePromise;
};
