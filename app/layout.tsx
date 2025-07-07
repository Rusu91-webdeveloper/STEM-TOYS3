import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "@/lib/i18n";
import { CurrencyProvider } from "@/lib/currency";
import CartProviderWrapper from "@/features/cart/components/CartProviderWrapper.client";
import ClientLayout from "@/components/layout/ClientLayout";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CentralizedSessionProvider } from "@/lib/auth/SessionContext";

import "./globals.css";
import { metadata as appMetadata } from "./metadata";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = appMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" className="scroll-smooth" suppressHydrationWarning={true}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <SessionProvider>
          <CentralizedSessionProvider>
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
          </CentralizedSessionProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
