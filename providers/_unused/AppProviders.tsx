"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";
import dynamic from "next/dynamic";
import { SessionProvider } from "next-auth/react";
import React from "react";

import ClientLayout from "@/components/layout/ClientLayout";
import { CartSkeleton } from "@/components/skeletons/cart-skeleton";
import { Toaster } from "@/components/ui/toaster";
import { CurrencyProvider } from "@/lib/currency";
import { I18nProvider } from "@/lib/i18n";

const CartProviderWrapper = dynamic(
  () => import("@/features/cart/components/CartProviderWrapper.client"),
  {
    ssr: false,
    loading: () => <CartSkeleton />,
  }
);

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <CurrencyProvider>
          <CartProviderWrapper>
            <ClientLayout>
              {children}
              <SpeedInsights />
            </ClientLayout>
            <Toaster />
          </CartProviderWrapper>
        </CurrencyProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
