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
        headline_variant: "hands_on_stem",
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
      <section aria-labelledby="home-title" className="bg-[#f7f6f2] text-[#152d26]">
        <div className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[0.9fr_1.2fr] lg:gap-14 lg:py-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#487561]">
              JUCĂRII STEM · ÎNVĂȚARE PRIN JOACĂ
            </p>
            <h1
              id="home-title"
              className="mt-4 max-w-2xl text-[2.5rem] font-bold leading-[1.06] tracking-[-0.045em] sm:text-5xl lg:text-[3.5rem]"
            >
              Joacă de azi.
              <br />
              <span className="text-[#487561]">
                Idei mari pentru mâine.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#53635c]">
              Seturi de construcție, experimente și jucării educative care
              transformă „cum funcționează?” în „am reușit!”. Descoperă
              următoarea provocare, potrivită vârstei copilului tău.
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
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#173e31] px-5 py-3 text-sm font-bold text-white hover:bg-[#24563f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#173e31]"
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
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-[#173e31]/25 px-5 py-3 text-sm font-semibold hover:bg-[#173e31]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#173e31]"
              >
                Cadouri 6–8 ani <ArrowRight size={18} />
              </Link>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#173e31]/15 pt-5 text-xs text-[#53635c]">
              {trust.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon
                    size={16}
                    className="shrink-0 text-[#487561]"
                    aria-hidden
                  />
                  {label}
                </li>
              ))}
            </ul>
            <Link href="/shipping#rto" className="mt-4 inline-block text-xs text-[#64726b] underline underline-offset-4 hover:text-[#173e31]">
              Detalii despre livrare și condițiile plății ramburs
            </Link>
          </div>
          <BrandScene />
        </div>
      </section>
    );
  }
);

HeroSection.displayName = "HeroSection";
