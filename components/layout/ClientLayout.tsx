"use client";

import { useTranslation } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";
import { SessionValidator } from "@/components/auth/SessionValidator";
import { SessionProvider } from "next-auth/react";
import { CentralizedSessionProvider } from "@/lib/auth/SessionContext";
import { AccountLinkingNotice } from "@/components/auth/AccountLinkingNotice";
import PromotionalPopup from "@/components/PromotionalPopup";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language } = useTranslation();

  // Update html lang attribute using useEffect
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <SessionProvider>
      <CentralizedSessionProvider>
        <SessionValidator />
        <AccountLinkingNotice />
        <PromotionalPopup />
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </CentralizedSessionProvider>
    </SessionProvider>
  );
}
