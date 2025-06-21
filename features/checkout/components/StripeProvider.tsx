"use client";

import React, { ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  return <Elements stripe={getStripe()}>{children}</Elements>;
}
