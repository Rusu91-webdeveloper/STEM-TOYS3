// Stripe loading strategy that bypasses service worker restrictions
import { loadStripe } from "@stripe/stripe-js";

// Strategy to bypass service worker blocking
export async function loadStripeBypassSW(publishableKey: string) {
  if (!publishableKey) {
    console.error("Stripe publishable key is required");
    return null;
  }

  // Strategy 1: Try to disable service worker for Stripe requests
  if ('serviceWorker' in navigator) {
    try {
      // Unregister service worker temporarily for Stripe
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        if (registration.active) {
          console.log("Service worker detected - attempting to bypass for Stripe");
          // Send message to service worker to allow Stripe requests
          registration.active.postMessage({
            type: 'ALLOW_STRIPE',
            urls: [
              'https://js.stripe.com',
              'https://cdn.jsdelivr.net',
              'https://unpkg.com'
            ]
          });
        }
      }
    } catch (error) {
      console.warn("Could not communicate with service worker:", error);
    }
  }

  // Strategy 2: Try loading with fetch bypass
  try {
    console.log("Attempting to load Stripe with fetch bypass...");
    
    // Create a new script element with different approach
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.defer = true;
    
    // Add to head with high priority
    document.head.appendChild(script);
    
    // Wait for script to load
    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Stripe script'));
      // Timeout after 10 seconds
      setTimeout(() => reject(new Error('Stripe script load timeout')), 10000);
    });

    // Now try to load Stripe
    const stripe = await loadStripe(publishableKey);
    if (stripe) {
      console.log("✅ Stripe loaded successfully with SW bypass");
      return stripe;
    }
  } catch (error) {
    console.warn("SW bypass strategy failed:", error);
  }

  // Strategy 3: Try with different CDN and cache busting
  const cdnSources = [
    'https://js.stripe.com/v3/',
    'https://cdn.jsdelivr.net/npm/@stripe/stripe-js@latest/dist/stripe.min.js',
    'https://unpkg.com/@stripe/stripe-js@latest/dist/stripe.min.js'
  ];

  for (const cdnSource of cdnSources) {
    try {
      console.log(`Trying CDN with cache busting: ${cdnSource}`);
      
      // Add cache busting parameter
      const cacheBustedUrl = `${cdnSource}?v=${Date.now()}&cb=${Math.random()}`;
      
      const script = document.createElement('script');
      script.src = cacheBustedUrl;
      script.async = true;
      script.defer = true;
      
      // Add specific attributes to bypass service worker
      script.setAttribute('data-bypass-sw', 'true');
      script.setAttribute('crossorigin', 'anonymous');
      
      document.head.appendChild(script);
      
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load from ${cdnSource}`));
        setTimeout(() => reject(new Error('Load timeout')), 8000);
      });

      const stripe = await loadStripe(publishableKey);
      if (stripe) {
        console.log(`✅ Stripe loaded from ${cdnSource}`);
        return stripe;
      }
    } catch (error) {
      console.warn(`Failed to load from ${cdnSource}:`, error);
    }
  }

  // Strategy 4: Try with minimal configuration and no external dependencies
  try {
    console.log("Attempting minimal Stripe load...");
    const stripe = await loadStripe(publishableKey, {
      apiVersion: "2023-10-16",
      betas: [],
      stripeAccount: undefined,
    });
    if (stripe) {
      console.log("✅ Stripe loaded with minimal config");
      return stripe;
    }
  } catch (error) {
    console.warn("Minimal config failed:", error);
  }

  console.error("❌ All Stripe loading strategies failed");
  return null;
}

// Enhanced getStripe function with service worker bypass
export async function getStripeBypassSW() {
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

  // Try to load Stripe with service worker bypass
  const stripe = await loadStripeBypassSW(publishableKey);
  
  if (!stripe) {
    console.error("Failed to load Stripe - service worker may be blocking requests");
  }
  
  return stripe;
}
