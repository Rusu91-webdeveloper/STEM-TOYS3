import { loadStripe, Stripe } from "@stripe/stripe-js";

// Alternative CDN endpoints for Stripe
const STRIPE_CDN_URLS = [
  "https://js.stripe.com/v3",
  "https://m.stripe.com/v3",
  "https://checkout.stripe.com/v3",
];

// Try to load Stripe from different CDN endpoints
export const loadStripeFromAlternativeCDN = async (
  publishableKey: string
): Promise<Stripe | null> => {
  console.log("Attempting to load Stripe from alternative CDN endpoints...");

  for (const cdnUrl of STRIPE_CDN_URLS) {
    try {
      console.log(`Trying CDN: ${cdnUrl}`);

      // Create a custom loadStripe function that uses a specific CDN
      const customLoadStripe = async (key: string) => {
        // Dynamically load Stripe script from the specific CDN
        const script = document.createElement('script');
        script.src = cdnUrl;
        script.async = true;
        
        return new Promise<Stripe | null>((resolve, reject) => {
          script.onload = () => {
            // @ts-ignore - Stripe will be available globally
            if (window.Stripe) {
              // @ts-ignore
              const stripe = window.Stripe(key);
              resolve(stripe);
            } else {
              reject(new Error('Stripe not available after script load'));
            }
          };
          script.onerror = () => reject(new Error(`Failed to load from ${cdnUrl}`));
          document.head.appendChild(script);
        });
      };

      const stripe = await customLoadStripe(publishableKey);
      if (stripe) {
        console.log(`Successfully loaded Stripe from ${cdnUrl}`);
        return stripe;
      }
    } catch (error) {
      console.error(`Failed to load from ${cdnUrl}:`, error);
    }
  }

  return null;
};

// Bypass API validation by using a different initialization approach
export const loadStripeWithoutAPIValidation = async (
  publishableKey: string
): Promise<Stripe | null> => {
  console.log("Attempting to load Stripe without API validation...");

  try {
    // Strategy 1: Use a timeout to prevent hanging on API calls
    console.log("Strategy 1: Timeout and retry mechanism");

    const loadWithTimeout = (timeout: number) => {
      return Promise.race([
        loadStripe(publishableKey),
        new Promise<null>(resolve => setTimeout(() => resolve(null), timeout)),
      ]);
    };

    // Try with different timeouts
    const timeouts = [5000, 3000, 1000]; // 5s, 3s, 1s
    for (const timeout of timeouts) {
      try {
        const stripe = await loadWithTimeout(timeout);
        if (stripe) {
          console.log(`Stripe loaded successfully with ${timeout}ms timeout`);
          return stripe;
        }
      } catch (error) {
        console.error(`Failed with ${timeout}ms timeout:`, error);
      }
    }

    // Strategy 2: Try loading with minimal configuration
    console.log("Strategy 2: Minimal configuration");
    try {
      const stripe = await loadStripe(publishableKey, {
        apiVersion: "2023-10-16",
        // Don't include betas or other options that might trigger API calls
      });
      if (stripe) {
        console.log("Stripe loaded with minimal config");
        return stripe;
      }
    } catch (error) {
      console.error("Failed with minimal config:", error);
    }

    // Strategy 3: Try with no configuration at all
    console.log("Strategy 3: No configuration");
    try {
      const stripe = await loadStripe(publishableKey, {});
      if (stripe) {
        console.log("Stripe loaded with no config");
        return stripe;
      }
    } catch (error) {
      console.error("Failed with no config:", error);
    }

  } catch (error) {
    console.error("All strategies failed:", error);
  }

  return null;
};

// Test if we can access Stripe's CDN from the client side
export const testClientSideStripeAccess = async (): Promise<boolean> => {
  if (typeof window === "undefined") {
    return false; // Server-side, can't test client-side access
  }

  try {
    // Try to fetch Stripe's script directly
    const response = await fetch("https://js.stripe.com/v3", {
      method: "GET",
      mode: "no-cors", // This will work even with CORS issues
    });

    console.log("Client-side Stripe CDN test:", response.status);
    return true;
  } catch (error) {
    console.error("Client-side Stripe CDN test failed:", error);
    return false;
  }
};

// Create a mock Stripe object for testing when real Stripe fails
export const createMockStripe = (): any => {
  console.warn("Creating mock Stripe object - this is for testing only");
  
  return {
    elements: () => ({
      create: () => ({
        mount: () => console.log("Mock element mounted"),
        unmount: () => console.log("Mock element unmounted"),
        on: () => console.log("Mock event listener added"),
      }),
    }),
    confirmCardPayment: async () => ({
      error: null,
      paymentIntent: { status: "succeeded" },
    }),
    // Add other methods as needed
  };
};
