"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { AccountLinkingNotice } from "@/components/auth/AccountLinkingNotice";
import { DatabaseConfigNotice } from "@/components/auth/DatabaseConfigNotice";
// import { SessionValidator } from "@/components/auth/SessionValidator";
import Header from "@/components/layout/Header";

const Footer = dynamic(() => import("@/components/layout/Footer"), {
  ssr: false,
});

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
  const isStorefrontSurface =
    !isAdminPage && !isSupplierPage && !isCheckoutPage;

  return (
    <>
      {/* <SessionValidator /> */}
      <AccountLinkingNotice />
      <DatabaseConfigNotice />
      {!isCheckoutPage && (
        <Suspense fallback={<div className="h-[72px] w-full" aria-hidden />}>
          <Header />
        </Suspense>
      )}
      <main
        className={`relative flex-grow ${
          isStorefrontSurface
            ? "storefront-shell overflow-hidden bg-[#f5f7fb]"
            : ""
        }`}
      >
        {isStorefrontSurface && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_4%,rgba(37,99,235,0.06),transparent_28%),radial-gradient(circle_at_92%_20%,rgba(14,165,233,0.05),transparent_24%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.018] bg-[radial-gradient(circle,_#0f172a_1px,_transparent_1px)] bg-[length:20px_20px]"
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
    </>
  );
}
