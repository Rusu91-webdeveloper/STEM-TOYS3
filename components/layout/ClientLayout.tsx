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
  initialStoreSettings,
}: {
  children: React.ReactNode;
  initialStoreSettings?: any;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  const isSupplierPage = pathname?.startsWith("/supplier");
  const isCheckoutPage = pathname?.startsWith("/checkout");
  const isStorefrontSurface = !isAdminPage && !isSupplierPage && !isCheckoutPage;

  return (
    <>
      {/* <SessionValidator /> */}
      <AccountLinkingNotice />
      <DatabaseConfigNotice />
      <Header />
      <main
        className={`relative flex-grow ${
          isStorefrontSurface
            ? "overflow-hidden bg-[linear-gradient(180deg,#f7fcff_0%,#eef7ff_48%,#f6f9ff_100%)]"
            : ""
        }`}
      >
        {isStorefrontSurface && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(52,211,153,0.08),transparent_45%),radial-gradient(circle_at_86%_15%,rgba(59,130,246,0.10),transparent_42%),radial-gradient(circle_at_55%_95%,rgba(251,191,36,0.05),transparent_40%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.025] bg-[radial-gradient(circle,_#0f172a_1px,_transparent_1px)] bg-[length:16px_16px]"
            />
          </>
        )}
        <div className={isStorefrontSurface ? "relative z-10" : undefined}>
          {children}
        </div>
      </main>
      {!isAdminPage && !isSupplierPage && !isCheckoutPage && (
        <Footer initialStoreSettings={initialStoreSettings} />
      )}
      <PromotionalPopup />
    </>
  );
}
