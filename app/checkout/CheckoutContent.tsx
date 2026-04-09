"use client";

import { Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { StripeBypassProvider } from "@/components/checkout/StripeBypassProvider";
import { CheckoutFlow } from "@/features/checkout/components/CheckoutFlow";
import { checkoutPageShellClass } from "@/features/checkout/lib/checkoutTheme";
import { useTranslation } from "@/lib/i18n";

export function CheckoutContent() {
  const { t } = useTranslation();

  return (
    <div className={checkoutPageShellClass}>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-slate-200/90 bg-white shadow-sm">
          <div className="container mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="flex shrink-0 items-center transition-opacity hover:opacity-90"
            >
              <Image
                src="/TechTots_LOGO.png"
                alt="TechTots"
                width={160}
                height={48}
                className="h-10 w-auto sm:h-11"
                priority
              />
            </Link>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
              aria-label={t("checkoutSecureSslPayment", "Plată securizată SSL")}
              title={t("checkoutSecureSslPayment", "Plată securizată SSL")}
            >
              <Lock className="h-4 w-4 shrink-0" aria-hidden />
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-600 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.22)] sm:mb-6">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Lock className="h-4 w-4" aria-hidden />
              </div>
              <p className="leading-relaxed">
                {t("checkoutSecureSslPayment", "Plată securizată SSL")}
              </p>
            </div>
            <StripeBypassProvider>
              <CheckoutFlow />
            </StripeBypassProvider>
          </div>
        </main>

        <footer className="border-t border-slate-200/90 bg-white py-6">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-center text-xs text-slate-500 sm:text-left">
                © {new Date().getFullYear()} TechTots.{" "}
                {t("checkoutRightsReserved", "Toate drepturile rezervate.")}
              </p>
              <nav
                className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
                aria-label="Checkout footer"
              >
                <Link
                  href="/faq"
                  className="text-slate-600 underline-offset-4 hover:text-primary hover:underline"
                >
                  {t("helpCenter", "Centru de ajutor")}
                </Link>
                <Link
                  href="/privacy"
                  className="text-slate-600 underline-offset-4 hover:text-primary hover:underline"
                >
                  {t("privacyPolicy", "Politica de confidențialitate")}
                </Link>
                <Link
                  href="/terms"
                  className="text-slate-600 underline-offset-4 hover:text-primary hover:underline"
                >
                  {t("termsAndConditions", "Termeni și condiții")}
                </Link>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
