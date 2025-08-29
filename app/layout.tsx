import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { SessionProvider } from "next-auth/react";

import ClientLayout from "@/components/layout/ClientLayout";
import { Toaster } from "@/components/ui/toaster";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import ConversionTrackingProvider from "@/components/conversion-tracking/ConversionTrackingProvider";
import CartProviderWrapper from "@/features/cart/components/CartProviderWrapper.client";
import { CentralizedSessionProvider } from "@/lib/auth/SessionContext";
import { CurrencyProvider } from "@/lib/currency";
import { I18nProvider } from "@/lib/i18n";

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
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/images/homepage_hero_banner_01.png"
          as="image"
          fetchPriority="high"
        />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <SessionProvider>
          <CentralizedSessionProvider>
            <I18nProvider initialLanguage={initialLanguage}>
              <CurrencyProvider>
                <CartProviderWrapper>
                  <ClientLayout>
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
