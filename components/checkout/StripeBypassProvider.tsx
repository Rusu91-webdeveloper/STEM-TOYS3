"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface StripeBypassContextType {
  useCustomForm: boolean;
  setUseCustomForm: (use: boolean) => void;
  stripeFailed: boolean;
}

const StripeBypassContext = createContext<StripeBypassContextType | undefined>(undefined);

export function StripeBypassProvider({ children }: { children: ReactNode }) {
  const [useCustomForm, setUseCustomForm] = useState(false);
  const [stripeFailed, setStripeFailed] = useState(false);

  useEffect(() => {
    // Check if Stripe is available after a timeout
    const checkStripeAvailability = () => {
      // @ts-ignore
      if (typeof window !== 'undefined' && !window.Stripe) {
        console.warn("Stripe not available in window object - using custom form");
        setStripeFailed(true);
        setUseCustomForm(true);
      }
    };

    // Check after 2 seconds
    const timeoutId = setTimeout(checkStripeAvailability, 2000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <StripeBypassContext.Provider value={{ useCustomForm, setUseCustomForm, stripeFailed }}>
      {children}
    </StripeBypassContext.Provider>
  );
}

export function useStripeBypass() {
  const context = useContext(StripeBypassContext);
  if (context === undefined) {
    throw new Error('useStripeBypass must be used within a StripeBypassProvider');
  }
  return context;
}
