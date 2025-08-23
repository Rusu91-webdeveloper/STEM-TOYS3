import { loadStripe, Stripe } from "@stripe/stripe-js";

// Alternative Stripe loading strategies
export const getStripeWithFallback = async (publishableKey: string): Promise<Stripe | null> => {
  console.log("Attempting to load Stripe with fallback strategies...");

  // Strategy 1: Standard loadStripe
  try {
    console.log("Strategy 1: Standard loadStripe");
    const stripe = await loadStripe(publishableKey);
    if (stripe) {
      console.log("Strategy 1 succeeded");
      return stripe;
    }
  } catch (error) {
    console.error("Strategy 1 failed:", error);
  }

  // Strategy 2: Load with different configuration
  try {
    console.log("Strategy 2: LoadStripe with minimal config");
    const stripe = await loadStripe(publishableKey, {
      apiVersion: "2023-10-16",
    });
    if (stripe) {
      console.log("Strategy 2 succeeded");
      return stripe;
    }
  } catch (error) {
    console.error("Strategy 2 failed:", error);
  }

  // Strategy 3: Try without any configuration
  try {
    console.log("Strategy 3: LoadStripe without config");
    const stripe = await loadStripe(publishableKey, {});
    if (stripe) {
      console.log("Strategy 3 succeeded");
      return stripe;
    }
  } catch (error) {
    console.error("Strategy 3 failed:", error);
  }

  // Strategy 4: Check if it's a network issue and provide helpful error
  console.error("All Stripe loading strategies failed");
  console.error("This indicates a network connectivity issue with js.stripe.com");
  
  return null;
};

// Test network connectivity to Stripe
export const testStripeConnectivity = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://js.stripe.com/v3', {
      method: 'HEAD',
      mode: 'no-cors', // This will work even with CORS issues
    });
    console.log("Stripe CDN connectivity test:", response.status);
    return true;
  } catch (error) {
    console.error("Stripe CDN connectivity test failed:", error);
    return false;
  }
};
