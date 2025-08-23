// Secure Stripe loading for production with real payments
import { loadStripe } from "@stripe/stripe-js";

// Production-ready Stripe loading with multiple fallbacks
export async function loadStripeProduction(publishableKey: string) {
  if (!publishableKey) {
    console.error("Stripe publishable key is required for production");
    return null;
  }

  // Strategy 1: Try to completely disable service worker for Stripe
  if ('serviceWorker' in navigator) {
    try {
      console.log("Attempting to disable service worker for Stripe...");
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        if (registration.active) {
          // Try to unregister the service worker completely
          await registration.unregister();
          console.log("Service worker unregistered for Stripe loading");
        }
      }
      
      // Wait a moment for unregistration to take effect
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.warn("Could not unregister service worker:", error);
    }
  }

  // Strategy 2: Load Stripe with aggressive cache busting
  try {
    console.log("Loading Stripe with aggressive cache busting...");
    
    // Create script with unique parameters
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const scriptUrl = `https://js.stripe.com/v3/?v=${timestamp}&cb=${random}&t=${timestamp}`;
    
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-stripe-production', 'true');
    
    // Add to head with high priority
    document.head.appendChild(script);
    
    // Wait for script to load
    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Stripe script'));
      setTimeout(() => reject(new Error('Stripe script load timeout')), 15000);
    });

    // Now try to load Stripe
    const stripe = await loadStripe(publishableKey);
    if (stripe) {
      console.log("✅ Stripe loaded successfully for production");
      return stripe;
    }
  } catch (error) {
    console.warn("Production Stripe loading failed:", error);
  }

  // Strategy 3: Try alternative CDN with production settings
  const productionCDNs = [
    'https://js.stripe.com/v3/',
    'https://cdn.jsdelivr.net/npm/@stripe/stripe-js@latest/dist/stripe.min.js',
    'https://unpkg.com/@stripe/stripe-js@latest/dist/stripe.min.js'
  ];

  for (const cdnSource of productionCDNs) {
    try {
      console.log(`Trying production CDN: ${cdnSource}`);
      
      // Add production-specific cache busting
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const productionUrl = `${cdnSource}?v=${timestamp}&cb=${random}&prod=true&t=${timestamp}`;
      
      const script = document.createElement('script');
      script.src = productionUrl;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-stripe-production', 'true');
      script.setAttribute('crossorigin', 'anonymous');
      
      document.head.appendChild(script);
      
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load from ${cdnSource}`));
        setTimeout(() => reject(new Error('Load timeout')), 12000);
      });

      const stripe = await loadStripe(publishableKey);
      if (stripe) {
        console.log(`✅ Stripe loaded from production CDN: ${cdnSource}`);
        return stripe;
      }
    } catch (error) {
      console.warn(`Failed to load from production CDN ${cdnSource}:`, error);
    }
  }

  // Strategy 4: Try with production configuration
  try {
    console.log("Attempting production Stripe configuration...");
    const stripe = await loadStripe(publishableKey, {
      apiVersion: "2023-10-16",
      betas: [],
      stripeAccount: undefined,
      // Production-specific settings
      _stripeJs: (window as any).Stripe,
    });
    if (stripe) {
      console.log("✅ Stripe loaded with production configuration");
      return stripe;
    }
  } catch (error) {
    console.warn("Production configuration failed:", error);
  }

  console.error("❌ All production Stripe loading strategies failed");
  console.error("⚠️ WARNING: Real payments will NOT be secure without Stripe Elements!");
  return null;
}

// Production-ready getStripe function
export async function getStripeProduction() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required for production");
    return null;
  }

  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    console.warn("Stripe can only be loaded in browser environment");
    return null;
  }

  // Try to load Stripe for production
  const stripe = await loadStripeProduction(publishableKey);
  
  if (!stripe) {
    console.error("⚠️ CRITICAL: Failed to load Stripe for production");
    console.error("⚠️ Real payments will NOT be secure!");
  }
  
  return stripe;
}
