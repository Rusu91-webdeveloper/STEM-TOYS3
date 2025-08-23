// Secure client-side Stripe integration with multiple fallback sources
import { loadStripe } from "@stripe/stripe-js";

// Multiple CDN sources to try
const STRIPE_CDN_SOURCES = [
  "https://js.stripe.com/v3/",
  "https://cdn.jsdelivr.net/npm/@stripe/stripe-js@latest/dist/stripe.min.js",
  "https://unpkg.com/@stripe/stripe-js@latest/dist/stripe.min.js",
];

// Custom loadStripe function with multiple fallbacks
export async function loadStripeSecure(publishableKey: string) {
  if (!publishableKey) {
    console.error("Stripe publishable key is required");
    return null;
  }

  // Try the standard loadStripe first
  try {
    console.log("Attempting to load Stripe from standard CDN...");
    const stripe = await loadStripe(publishableKey);
    if (stripe) {
      console.log("✅ Stripe loaded successfully from standard CDN");
      return stripe;
    }
  } catch (error) {
    console.warn("Standard Stripe CDN failed:", error);
  }

  // Try alternative CDN sources
  for (const cdnSource of STRIPE_CDN_SOURCES.slice(1)) {
    try {
      console.log(`Attempting to load Stripe from: ${cdnSource}`);
      
      // Dynamically load the script
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = cdnSource;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load from ${cdnSource}`));
        document.head.appendChild(script);
      });

      // Try loading Stripe again
      const stripe = await loadStripe(publishableKey);
      if (stripe) {
        console.log(`✅ Stripe loaded successfully from ${cdnSource}`);
        return stripe;
      }
    } catch (error) {
      console.warn(`Failed to load from ${cdnSource}:`, error);
    }
  }

  // If all CDN sources fail, try with minimal configuration
  try {
    console.log("Attempting to load Stripe with minimal configuration...");
    const stripe = await loadStripe(publishableKey, {
      apiVersion: "2023-10-16",
      betas: [],
    });
    if (stripe) {
      console.log("✅ Stripe loaded with minimal configuration");
      return stripe;
    }
  } catch (error) {
    console.warn("Minimal configuration failed:", error);
  }

  console.error("❌ All Stripe loading attempts failed");
  return null;
}

// Enhanced getStripe function with better error handling
export async function getStripeSecure() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
    return null;
  }

  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    console.warn("Stripe can only be loaded in browser environment");
    return null;
  }

  // Try to load Stripe
  const stripe = await loadStripeSecure(publishableKey);
  
  if (!stripe) {
    console.error("Failed to load Stripe - payment system unavailable");
  }
  
  return stripe;
}
