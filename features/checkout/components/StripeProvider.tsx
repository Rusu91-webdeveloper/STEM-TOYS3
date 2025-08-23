"use client";

import { Elements } from "@stripe/react-stripe-js";
import React, { ReactNode, useState, useEffect } from "react";

import { getStripe } from "@/lib/stripe";

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStripe = async () => {
      try {
        const stripe = await getStripe();
        setStripePromise(Promise.resolve(stripe));
      } catch (err) {
        console.error("Failed to load Stripe:", err);
        setError(err instanceof Error ? err.message : "Failed to load payment system");
      }
    };

    loadStripe();
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">Eroare la încărcarea sistemului de plată</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            Reîncearcă
          </button>
        </div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Se încarcă sistemul de plată...</p>
        </div>
      </div>
    );
  }

  return <Elements stripe={stripePromise}>{children}</Elements>;
}
