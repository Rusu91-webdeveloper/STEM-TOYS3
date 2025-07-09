"use client";

import React, { ReactNode } from "react";

import { CentralizedSessionProvider } from "@/lib/auth/SessionContext";

import { CartProvider } from "../context/CartContext";
import { CheckoutTransitionProvider } from "../context/CheckoutTransitionContext";

interface CartProviderWrapperProps {
  children: ReactNode;
}

/**
 * Optimized Cart Provider Wrapper - Removed debugging components for better performance
 */
export default function CartProviderWrapper({
  children,
}: CartProviderWrapperProps) {
  return (
    <CentralizedSessionProvider>
      <CheckoutTransitionProvider>
        <CartProvider>{children}</CartProvider>
      </CheckoutTransitionProvider>
    </CentralizedSessionProvider>
  );
}
