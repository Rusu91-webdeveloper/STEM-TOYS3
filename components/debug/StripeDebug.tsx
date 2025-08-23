"use client";

import React, { useEffect, useState } from "react";
import { getStripe } from "@/lib/stripe";

export function StripeDebug() {
  const [stripeStatus, setStripeStatus] = useState<string>("Loading...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStripe = async () => {
      try {
        const stripe = await getStripe();
        if (stripe) {
          setStripeStatus("Stripe loaded successfully");
        } else {
          setStripeStatus("Stripe returned null");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setStripeStatus("Stripe failed to load");
      }
    };

    checkStripe();
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-sm z-50 max-w-xs">
      <h3 className="font-bold mb-2">Stripe Debug Info</h3>
      <p>Status: {stripeStatus}</p>
      <p>Environment: {process.env.NODE_ENV}</p>
      <p>Key Available: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "Yes" : "No"}</p>
      {error && <p className="text-red-400">Error: {error}</p>}
    </div>
  );
}
