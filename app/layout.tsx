import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { SessionProvider } from "next-auth/react";

import ConversionTrackingProvider from "@/components/conversion-tracking/ConversionTrackingProvider";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import PerformanceMonitor from "@/components/analytics/PerformanceMonitor";
import ClientLayout from "@/components/layout/ClientLayout";
import { getStoreSettings } from "@/lib/utils/store-settings";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { Toaster } from "@/components/ui/toaster";
import CartProviderWrapper from "@/features/cart/components/CartProviderWrapper.client";
import { CentralizedSessionProvider } from "@/lib/auth/SessionContext";
import { CurrencyProvider } from "@/lib/currency";
import { I18nProvider } from "@/lib/i18n";
import { CriticalCSS } from "@/components/CriticalCSS";

import "./globals.css";
import { metadata as appMetadata } from "./metadata";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = appMetadata;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the language cookie on the server side
  const cookieStore = await cookies();
  const initialLanguage = cookieStore.get("language")?.value ?? "ro";

  // SSR store settings to avoid client fetch on first paint
  const initialStoreSettings = await getStoreSettings();

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

        {/* **PERFORMANCE**: Font preconnect for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* **PERFORMANCE**: Removed hero image preload to fix unused preload warnings */}
        {/* **PERFORMANCE**: Removed unused responsive image variants to fix preload warnings */}

        {/* Google Analytics 4 */}
        <GoogleAnalytics />
        {/* Performance Monitoring */}
        <PerformanceMonitor />
        {/* Page-scoped JSON-LD only; global injection removed */}
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <SessionProvider>
          <CentralizedSessionProvider>
            <I18nProvider initialLanguage={initialLanguage}>
              <CurrencyProvider>
                <CartProviderWrapper>
                  <ClientLayout initialStoreSettings={initialStoreSettings}>
                    {children}
                    <SpeedInsights />
                  </ClientLayout>
                  <Toaster />
                  <ServiceWorkerRegistration />
                  <ConversionTrackingProvider />
                </CartProviderWrapper>
              </CurrencyProvider>
            </I18nProvider>
          </CentralizedSessionProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
