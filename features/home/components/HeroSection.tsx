"use client";

import {
  ArrowRight,
  Banknote,
  CreditCard,
  Truck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";

import {
  HOMEPAGE_CONVERSION_EVENTS,
  trackHomepageConversionEvent,
} from "@/lib/analytics/homepage-conversion-events";

import { BrandScene } from "./BrandScene";

export const HeroSection = React.memo(
  ({ t }: { t: (key: string, fallback?: string) => string }) => {
    useEffect(() => {
      trackHomepageConversionEvent(HOMEPAGE_CONVERSION_EVENTS.HERO_IMPRESSION, {
        section: "hero",
        headline_variant: "screen_free",
        cta_variant: "catalog_gift",
      });
    }, []);
    const trust = [
      { icon: Banknote, label: "Plată ramburs (COD)" },
      { icon: Truck, label: t("heroTrust2", "Livrare 1–4 zile lucrătoare") },
      { icon: Sparkles, label: "Branduri atent selectate" },
      { icon: CreditCard, label: "Netopia / Stripe" },
    ];
    return (
      <section aria-labelledby="home-title" className="bg-[#0b1b32] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:py-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Mâini ocupate. Minți curioase.
            </p>
            <h1
              id="home-title"
              className="mt-4 max-w-2xl text-[2.5rem] font-bold leading-[1.06] tracking-[-0.045em] sm:text-5xl lg:text-[3.5rem]"
            >
              STEM fără ecran.
              <br />
              <span className="text-emerald-200">
                Cadouri care merită despachetate.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-200">
              Jucării de construit, experimente și descoperiri pe bune. Alege
              după vârstă și transformă curiozitatea în „uite ce am făcut!”.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                onClick={() =>
                  trackHomepageConversionEvent(
                    HOMEPAGE_CONVERSION_EVENTS.HERO_PRIMARY_CTA_CLICK,
                    { cta_label: "Explorează colecția" }
                  )
                }
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Explorează colecția <ArrowRight size={18} />
              </Link>
              <Link
                href="/cadouri-stem-6-8-ani"
                onClick={() =>
                  trackHomepageConversionEvent(
                    HOMEPAGE_CONVERSION_EVENTS.HERO_SECONDARY_CTA_CLICK,
                    { cta_label: "Cadouri 6–8 ani" }
                  )
                }
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-white/35 px-5 py-3 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Cadouri 6–8 ani <ArrowRight size={18} />
              </Link>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/15 pt-5 text-xs text-slate-200">
              {trust.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon
                    size={16}
                    className="shrink-0 text-emerald-200"
                    aria-hidden
                  />
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <BrandScene />
        </div>
      </section>
    );
  }
);

HeroSection.displayName = "HeroSection";
