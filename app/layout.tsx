import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import AnalyticsWrapper from "@/components/analytics/AnalyticsWrapper";
import PerformanceMonitor from "@/components/analytics/PerformanceMonitor";
import { SafeSessionProvider } from "@/components/auth/SafeSessionProvider";
import ConversionTrackingProvider from "@/components/conversion-tracking/ConversionTrackingProvider";
import { CriticalCSS } from "@/components/CriticalCSS";
import ClientLayout from "@/components/layout/ClientLayout";
import StructuredDataInjector from "@/components/seo/StructuredDataInjector";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { Toaster } from "@/components/ui/toaster";
import CartProviderWrapper from "@/features/cart/components/CartProviderWrapper.client";
import { CentralizedSessionProvider } from "@/lib/auth/SessionContext";
import { CurrencyProvider } from "@/lib/currency";
import { I18nProvider } from "@/lib/i18n";
import { getStoreSettings } from "@/lib/utils/store-settings";

import "./globals.css";
import { metadata as appMetadata } from "./metadata";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = appMetadata;
export const revalidate = 3600;

const STORE_SETTINGS_TIMEOUT_MS = 150;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLanguage = "ro";

  // Don't let slow DB/cache calls block initial document response.
  const initialStoreSettings = await Promise.race([
    getStoreSettings(),
    new Promise<null>(resolve =>
      setTimeout(() => resolve(null), STORE_SETTINGS_TIMEOUT_MS)
    ),
  ]);

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

        {/* Analytics Components (Client-only to avoid SSR issues) */}
        <AnalyticsWrapper />
        {/* Performance Monitoring */}
        <PerformanceMonitor />
        {/* Organization Schema for Site-wide SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "TechTots România",
              url: "https://techtots.ro",
              logo: "https://techtots.ro/images/logo.png",
              description:
                "Jucării STEM și resurse educaționale pentru copii români",
              foundingDate: "2024",
              address: {
                "@type": "PostalAddress",
                streetAddress: (initialStoreSettings as any)?.businessAddress || "Strada Mehedinți 54-56",
                addressLocality: (initialStoreSettings as any)?.businessCity || "Cluj-Napoca",
                addressRegion: (initialStoreSettings as any)?.businessState || "Cluj",
                postalCode: (initialStoreSettings as any)?.businessPostalCode || "400000",
                addressCountry: "RO",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: initialStoreSettings?.contactPhone || process.env.FANCOURIER_SENDER_PHONE || "+40771248029",
                contactType: "customer service",
                availableLanguage: "Romanian",
              },
              sameAs: [
                "https://www.facebook.com/techtotsromania",
                "https://www.instagram.com/techtotsro",
                "https://www.linkedin.com/company/techtots-romania",
              ],
            }),
          }}
        />
        {/* Page-scoped JSON-LD only; global injection removed */}
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
                  <ServiceWorkerRegistration />
                  <ConversionTrackingProvider />
                </CartProviderWrapper>
              </CurrencyProvider>
            </I18nProvider>
          </CentralizedSessionProvider>
        </SafeSessionProvider>
      </body>
    </html>
  );
}
