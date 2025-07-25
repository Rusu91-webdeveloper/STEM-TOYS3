"use client";

import { Elements } from "@stripe/react-stripe-js";
import React, { ReactNode } from "react";

import { getStripe } from "@/lib/stripe";

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  return <Elements stripe={getStripe()}>{children}</Elements>;
}
