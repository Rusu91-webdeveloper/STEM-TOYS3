"use client";

import Link from "next/link";
import React from "react";
import {
  glassCardClass,
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";

interface SupplierBannerProps {
  t: (key: string, defaultValue?: string) => string;
}

// [INFO] SupplierBanner: Professional, attractive banner designed to convert visitors into suppliers
// - Modern gradient background with professional color scheme
// - Icon-based benefits display for visual appeal
// - Responsive design with mobile-first approach
// - Hover effects and smooth animations
// - Clear call-to-action with conversion tracking
// - Accessible with proper ARIA labels and keyboard navigation

const SupplierBannerComponent = ({ t }: SupplierBannerProps) => {
  const benefits = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5 sm:h-6 sm:w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
      title: t("supplier_benefit_1", "Lucrare Rapidă"),
      description: t("supplier_benefit_1_desc", "Plăți în 30 de zile"),
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5 sm:h-6 sm:w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
      ),
      title: t("supplier_benefit_2", "Crescere Rapidă"),
      description: t("supplier_benefit_2_desc", "Acces la piața românească"),
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5 sm:h-6 sm:w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
      ),
      title: t("supplier_benefit_3", "Suport Complet"),
      description: t(
        "supplier_benefit_3_desc",
        "Asistență tehnică și marketing"
      ),
    },
  ];

  return (
    <section className="py-6 sm:py-8 md:py-10 lg:py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div
          className={`${glassPanelClass} relative overflow-hidden rounded-3xl border-white/15 bg-gradient-to-br from-slate-950/95 via-indigo-950/85 to-slate-900/90 text-slate-100`}
        >
          <div className="absolute inset-0 opacity-60">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),_transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(165,180,252,0.2),_transparent_60%)]" />
          </div>

          <div className="relative z-10 grid grid-cols-1 items-center gap-6 px-6 py-8 sm:gap-8 sm:px-8 sm:py-10 lg:grid-cols-2 lg:gap-12 lg:px-12 lg:py-12">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 013.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z"
                  />
                </svg>
                {t("supplier_opportunity", "Oportunitate de Afaceri")}
              </div>

              <h2 className="mt-4 bg-gradient-to-r from-emerald-200 via-sky-200 to-indigo-200 bg-clip-text text-xl font-bold leading-tight text-transparent sm:text-2xl md:text-3xl lg:text-4xl">
                {t("supplier_banner_title", "Devino Furnizor TechTots")}
              </h2>

              <p className="mt-4 text-sm text-slate-200/85 sm:text-base lg:text-lg">
                {t(
                  "supplier_banner_subtitle",
                  "Alătură-te rețelei noastre de furnizori și ajută la educarea generațiilor viitoare cu jucării STEM de calitate."
                )}
              </p>

              <Link
                href="/supplier"
                aria-label={t("become_supplier")}
                tabIndex={0}
                data-conversion="cta"
                data-conversion-type="click"
                data-conversion-category="supplier_banner"
                data-conversion-action="become_supplier"
                data-conversion-element="supplier_banner_button"
                className={`${gradientButtonClass} mt-6 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:text-base`}
              >
                {t("become_supplier")}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className={`${glassCardClass} cursor-pointer rounded-2xl p-2 text-center transition duration-300 hover:border-emerald-400/60 hover:shadow-emerald-500/20 sm:p-3 md:p-4`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${benefit.title}: ${benefit.description}`}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      window.location.href = "/supplier";
                    }
                  }}
                  onClick={() => (window.location.href = "/supplier")}
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/40 via-sky-400/40 to-indigo-400/40 text-white shadow-emerald-500/20 transition-transform duration-300 hover:scale-105 sm:h-14 sm:w-14">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xs font-semibold text-white sm:text-sm md:text-base">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-[0.65rem] text-slate-200/80 sm:text-xs">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const SupplierBanner = React.memo(SupplierBannerComponent);
