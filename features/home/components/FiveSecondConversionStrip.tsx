"use client";

import { ArrowRight, BadgeCheck, Clock3, Gift } from "lucide-react";
import Link from "next/link";
import React from "react";

import {
  glassCardClass,
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";
import {
  HOMEPAGE_CONVERSION_EVENTS,
  trackHomepageConversionEvent,
} from "@/lib/analytics/homepage-conversion-events";
import { useTranslation } from "@/lib/i18n";

interface FiveSecondConversionStripProps {
  t: (key: string, defaultValue?: string) => string;
}

export default function FiveSecondConversionStrip({
  t,
}: FiveSecondConversionStripProps) {
  const { language } = useTranslation();
  const isRomanian = language === "ro";

  const steps = [
    {
      icon: Clock3,
      title: isRomanian ? "Alegi în 30 de secunde" : "Choose in 30 seconds",
      description: isRomanian
        ? "Filtre clare pe vârstă și interese, ca să găsești rapid opțiunea potrivită."
        : "Clear filters by age and interests so you can find the right option fast.",
      href: "/products",
      cta: isRomanian ? "Start rapid" : "Quick start",
    },
    {
      icon: Gift,
      title: isRomanian ? "Compari pachetele" : "Compare bundles",
      description: isRomanian
        ? "Vezi imediat ce primești în fiecare pachet și cât economisești."
        : "See exactly what each bundle includes and how much you save.",
      href: "/products?bundleView=bundles",
      cta: isRomanian ? "Vezi bundle-uri" : "See bundles",
    },
    {
      icon: BadgeCheck,
      title: isRomanian ? "Comanzi fără stres" : "Order stress-free",
      description: isRomanian
        ? "Checkout simplu, suport rapid și livrare clară până la ușa ta."
        : "Simple checkout, fast support, and clear delivery to your door.",
      href: "/checkout",
      cta: isRomanian ? "Finalizare rapidă" : "Fast checkout",
    },
  ];

  const sectionBadge = isRomanian
    ? "Alegi rapid, fără stres"
    : "Fast and easy choice";
  const sectionTitle = t(
    "fiveSecondRuleHeadline",
    isRomanian
      ? "Găsești pachetul potrivit în mai puțin de 1 minut"
      : "Find the right bundle in less than 1 minute"
  );
  const sectionDescription = isRomanian
    ? "Recomandări clare, pachete avantajoase și pași simpli care te duc rapid spre comandă."
    : "Clear recommendations, value bundles, and simple steps that move you quickly to checkout.";
  const primaryCtaLabel = isRomanian
    ? "Vreau cele mai bune pachete"
    : "Show me best bundles";
  const secondaryCtaLabel = isRomanian
    ? "Explorează toate produsele"
    : "Explore all products";

  return (
    <section className="py-6 sm:py-8 md:py-10" aria-label="Decizie rapidă">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`${glassPanelClass} p-4 sm:p-6 lg:p-8`}>
          <div className="mb-5 text-center sm:mb-7">
            <span className="inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
              {sectionBadge}
            </span>
            <h2 className="mt-3 bg-gradient-to-r from-emerald-100 via-sky-100 to-indigo-100 bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
              {sectionTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-3xl text-sm text-slate-200/85 sm:text-base">
              {sectionDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.title}
                  href={step.href}
                  onClick={() =>
                    trackHomepageConversionEvent(
                      HOMEPAGE_CONVERSION_EVENTS.FIVE_SECOND_STEP_CLICK,
                      {
                        step_title: step.title,
                        step_cta: step.cta,
                        target_href: step.href,
                      }
                    )
                  }
                  data-conversion="cta"
                  data-conversion-type="click"
                  data-conversion-category="navigation"
                  data-conversion-action="five_second_step_click"
                  data-conversion-element={`five_second_step_${step.title.toLowerCase().replace(/\s+/g, "_")}`}
                  data-conversion-metadata={JSON.stringify({
                    stepTitle: step.title,
                    stepCta: step.cta,
                    targetHref: step.href,
                  })}
                  className={`${glassCardClass} group rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/50 hover:shadow-emerald-500/20`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 via-sky-500/20 to-indigo-500/20 text-emerald-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-200">
                      {step.cta}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300/85">
                    {step.description}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/products?bundleView=bundles"
              onClick={() =>
                  trackHomepageConversionEvent(
                    HOMEPAGE_CONVERSION_EVENTS.FIVE_SECOND_PRIMARY_CTA_CLICK,
                    {
                    cta_label: primaryCtaLabel,
                    target_href: "/products?bundleView=bundles",
                  }
                )
              }
              data-conversion="cta"
              data-conversion-type="click"
              data-conversion-category="ecommerce"
              data-conversion-action="five_second_primary_bundle_cta_click"
              data-conversion-element="five_second_primary_bundle_cta"
              className={`${gradientButtonClass} inline-flex h-11 items-center justify-center px-6 text-sm font-bold`}
            >
              {primaryCtaLabel}
            </Link>
            <Link
              href="/products"
              onClick={() =>
                  trackHomepageConversionEvent(
                    HOMEPAGE_CONVERSION_EVENTS.FIVE_SECOND_SECONDARY_CTA_CLICK,
                    {
                    cta_label: secondaryCtaLabel,
                    target_href: "/products",
                  }
                )
              }
              data-conversion="cta"
              data-conversion-type="click"
              data-conversion-category="navigation"
              data-conversion-action="five_second_secondary_products_cta_click"
              data-conversion-element="five_second_secondary_products_cta"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/15"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
