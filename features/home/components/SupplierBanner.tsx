"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
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
      tone: "from-emerald-500 to-cyan-500",
      ring: "ring-emerald-100",
      panel: "bg-emerald-50",
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
      tone: "from-sky-500 to-indigo-500",
      ring: "ring-sky-100",
      panel: "bg-sky-50",
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
      tone: "from-indigo-500 to-violet-500",
      ring: "ring-indigo-100",
      panel: "bg-indigo-50",
    },
  ];

  return (
    <section className="py-5 sm:py-8 md:py-10 lg:py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div
          className={`${glassPanelClass} relative overflow-hidden rounded-3xl border-slate-200/80 bg-white/95 text-slate-900 shadow-[0_28px_60px_-40px_rgba(15,23,42,0.22)]`}
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(16,185,129,0.10),transparent_42%),radial-gradient(circle_at_88%_14%,rgba(59,130,246,0.12),transparent_40%),radial-gradient(circle_at_78%_85%,rgba(129,140,248,0.10),transparent_38%)]" />
            <div className="absolute inset-y-0 right-0 hidden w-[46%] lg:block" aria-hidden>
              <Image
                src="/Technology.png"
                alt=""
                fill
                sizes="40vw"
                className="object-cover object-center opacity-20 blur-[3px]"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-white/80 via-white/65 to-white/20" />
            </div>
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,_#0f172a_1px,_transparent_1px)] bg-[length:14px_14px]" />
          </div>

          <div className="relative z-10 grid grid-cols-1 items-center gap-5 px-5 py-6 sm:gap-8 sm:px-8 sm:py-10 lg:grid-cols-2 lg:gap-12 lg:px-12 lg:py-12">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
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

              <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
                {t("supplier_banner_title", "Devino Furnizor TechTots")}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:mt-4 sm:text-base lg:text-lg">
                {t(
                  "supplier_banner_subtitle",
                  "Alătură-te rețelei noastre de furnizori și ajută la educarea generațiilor viitoare cu jucării STEM de calitate."
                )}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-600 lg:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Marketplace românesc activ
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  Onboarding rapid
                </span>
              </div>

              <Link
                href="/supplier"
                aria-label={t("become_supplier")}
                tabIndex={0}
                data-conversion="cta"
                data-conversion-type="click"
                data-conversion-category="supplier_banner"
                data-conversion-action="become_supplier"
                data-conversion-element="supplier_banner_button"
                className={`${gradientButtonClass} mt-5 inline-flex h-12 items-center gap-2 rounded-2xl px-6 text-sm font-extrabold shadow-[0_18px_35px_-18px_rgba(14,165,233,0.5)] ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:shadow-[0_24px_42px_-18px_rgba(14,165,233,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:mt-6 sm:h-12 sm:px-7 sm:text-base`}
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3 md:gap-4 lg:gap-5">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className={`group cursor-pointer rounded-2xl border border-slate-200 bg-white/95 p-3 text-center shadow-[0_14px_30px_-24px_rgba(15,23,42,0.18)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_18px_35px_-24px_rgba(14,165,233,0.18)] sm:p-3 md:p-4`}
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
                  <div
                    className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${benefit.panel} text-slate-900 ring-1 ${benefit.ring} shadow-[0_12px_20px_-16px_rgba(15,23,42,0.2)] transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${benefit.tone} text-white`}>
                      {benefit.icon}
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 sm:text-sm md:text-base">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-[0.7rem] leading-relaxed text-slate-600 sm:text-xs">
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
