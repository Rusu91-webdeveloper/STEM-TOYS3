"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, Shield } from "lucide-react";

interface ServiceWorkerBypassProps {
  onStripeReady: () => void;
  onStripeFailed: () => void;
}

export function ServiceWorkerBypass({ onStripeReady, onStripeFailed }: ServiceWorkerBypassProps) {
  const [isBypassing, setIsBypassing] = useState(false);
  const [bypassStatus, setBypassStatus] = useState<string>("");
  const [hasServiceWorker, setHasServiceWorker] = useState(false);

  useEffect(() => {
    // Check if service worker is active
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        setHasServiceWorker(registrations.length > 0);
      });
    }
  }, []);

  const bypassServiceWorker = async () => {
    setIsBypassing(true);
    setBypassStatus("Detecting service worker...");

    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        if (registrations.length > 0) {
          setBypassStatus("Service worker detected. Attempting to bypass...");
          
          // Try to unregister service worker temporarily
          for (const registration of registrations) {
            if (registration.active) {
              // Try to unregister the service worker temporarily
              try {
                await registration.unregister();
                setBypassStatus("Service worker unregistered. Loading Stripe...");
                console.log("Service worker unregistered successfully");
              } catch (error) {
                console.warn("Could not unregister service worker:", error);
                // Fallback: send message to allow Stripe
                registration.active.postMessage({
                  type: 'ALLOW_STRIPE',
                  urls: [
                    'https://js.stripe.com',
                    'https://cdn.jsdelivr.net',
                    'https://unpkg.com'
                  ]
                });
                setBypassStatus("Service worker bypassed. Loading Stripe...");
              }
              
              setBypassStatus("Service worker bypassed. Loading Stripe...");
              
              // Wait a moment for the message to be processed
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } else {
          setBypassStatus("No service worker found. Loading Stripe directly...");
        }
      }

      // Try to load Stripe after bypass
      setBypassStatus("Attempting to load Stripe...");
      
      // Simulate Stripe loading attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if Stripe is now available
      if (typeof window !== 'undefined' && (window as any).Stripe) {
        setBypassStatus("✅ Stripe loaded successfully!");
        onStripeReady();
      } else {
        setBypassStatus("❌ Stripe still not available");
        onStripeFailed();
      }
      
    } catch (error) {
      console.error("Service worker bypass failed:", error);
      setBypassStatus("❌ Bypass failed. Using fallback payment form.");
      onStripeFailed();
    } finally {
      setIsBypassing(false);
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  if (!hasServiceWorker) {
    return null; // Don't show if no service worker
  }

  return (
    <div className="space-y-4">
      <Alert className="border-orange-200 bg-orange-50">
        <Shield className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Service Worker Detected</strong> - This may be blocking Stripe from loading. 
          Click the button below to attempt to bypass this restriction.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={bypassServiceWorker}
          disabled={isBypassing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isBypassing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Bypassing...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              Bypass Service Worker
            </>
          )}
        </Button>

        <Button
          onClick={refreshPage}
          variant="ghost"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Page
        </Button>
      </div>

      {bypassStatus && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <strong>Status:</strong> {bypassStatus}
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>If the bypass doesn't work, the payment form will automatically use a fallback solution.</p>
      </div>
    </div>
  );
}
