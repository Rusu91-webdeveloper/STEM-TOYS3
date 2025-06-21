"use client";

import React, { ReactNode } from "react";
import { CartProvider } from "../context/CartContext";
import { SessionProvider } from "next-auth/react";
import { CheckoutTransitionProvider } from "../context/CheckoutTransitionContext";

interface CartProviderWrapperProps {
  children: ReactNode;
  session?: any;
}

/**
 * Optimized Cart Provider Wrapper - Removed debugging components for better performance
 */
export default function CartProviderWrapper({
  children,
  session,
}: CartProviderWrapperProps) {
  return (
    <SessionProvider session={session}>
      <CheckoutTransitionProvider>
        <CartProvider>{children}</CartProvider>
      </CheckoutTransitionProvider>
    </SessionProvider>
  );
}
