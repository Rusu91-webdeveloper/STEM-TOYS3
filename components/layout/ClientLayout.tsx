"use client";

import { AccountLinkingNotice } from "@/components/auth/AccountLinkingNotice";
import { DatabaseConfigNotice } from "@/components/auth/DatabaseConfigNotice";
// import { SessionValidator } from "@/components/auth/SessionValidator";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import PromotionalPopup from "@/components/PromotionalPopup";
import { usePathname } from "next/navigation";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  const isSupplierPage = pathname?.startsWith("/supplier");

  return (
    <>
      {/* <SessionValidator /> */}
      <AccountLinkingNotice />
      <DatabaseConfigNotice />
      <Header />
      <main className="flex-grow">{children}</main>
      {!isAdminPage && !isSupplierPage && <Footer />}
      <PromotionalPopup />
    </>
  );
}
