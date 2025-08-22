"use client";

import { AccountLinkingNotice } from "@/components/auth/AccountLinkingNotice";
import { DatabaseConfigNotice } from "@/components/auth/DatabaseConfigNotice";
// import { SessionValidator } from "@/components/auth/SessionValidator";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import PromotionalPopup from "@/components/PromotionalPopup";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* <SessionValidator /> */}
      <AccountLinkingNotice />
      <DatabaseConfigNotice />
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <PromotionalPopup />
    </>
  );
}
