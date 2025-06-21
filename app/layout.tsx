import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProviderWrapper } from "@/features/cart";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/lib/i18n";
import { CurrencyProvider } from "@/lib/currency";
import ClientLayout from "@/components/layout/ClientLayout";
import { metadata as appMetadata } from "./metadata";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SessionValidator } from "@/components/auth/SessionValidator";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = appMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className="scroll-smooth">
      <head>
        <link
          rel="icon"
          type="image/svg+xml"
          href="/favicon.svg"
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ErrorBoundary level="critical">
          <NavigationProgress />
          <I18nProvider>
            <CurrencyProvider>
              <CartProviderWrapper>
                <ErrorBoundary level="page">
                  <ClientLayout>
                    <SessionValidator />
                    {children}
                    <SpeedInsights />
                  </ClientLayout>
                </ErrorBoundary>
                <Toaster />
              </CartProviderWrapper>
            </CurrencyProvider>
          </I18nProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
