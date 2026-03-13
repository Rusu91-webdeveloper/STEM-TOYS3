import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SafeSessionProvider } from "@/components/auth/SafeSessionProvider";
import { CriticalCSS } from "@/components/CriticalCSS";
import DeferredClientFeatures from "@/components/DeferredClientFeatures";
import ClientLayout from "@/components/layout/ClientLayout";
import StructuredDataInjector from "@/components/seo/StructuredDataInjector";
import { Toaster } from "@/components/ui/toaster";
import CartProviderWrapper from "@/features/cart/components/CartProviderWrapper.client";
import { CentralizedSessionProvider } from "@/lib/auth/SessionContext";
import { CurrencyProvider } from "@/lib/currency";
import { I18nProvider } from "@/lib/i18n";

import "./globals.css";
import { metadata as appMetadata } from "./metadata";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = appMetadata;
export const revalidate = 3600;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLanguage = "ro";
  const initialStoreSettings = null;

  return (
    <html
      lang={initialLanguage}
      className="scroll-smooth"
      data-scroll-behavior="smooth"
      suppressHydrationWarning={true}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" href="/favicon.ico" sizes="any" />

        {/* Critical CSS for LCP optimization */}
        <CriticalCSS />

        {/* **PERFORMANCE**: Aggressive hero image preloading for LCP optimization */}
        <link
          rel="preload"
          href="/images/optimized/homepage_hero_banner_01_fallback.jpg"
          as="image"
          fetchPriority="high"
        />

        {/* Structured data is injected from route metadata to keep entity data consistent. */}
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <StructuredDataInjector />
        <SafeSessionProvider>
          <CentralizedSessionProvider>
            <I18nProvider initialLanguage={initialLanguage}>
              <CurrencyProvider>
                <CartProviderWrapper>
                  <ClientLayout initialStoreSettings={initialStoreSettings}>
                    {children}
                    <SpeedInsights />
                    <Analytics />
                  </ClientLayout>
                  <Toaster />
                  <DeferredClientFeatures />
                </CartProviderWrapper>
              </CurrencyProvider>
            </I18nProvider>
          </CentralizedSessionProvider>
        </SafeSessionProvider>
      </body>
    </html>
  );
}
