"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

import { glassPanelClass } from "@/features/home/components/homeTheme";
import type { HomeBundle } from "@/features/home/types";
import {
  HOMEPAGE_CONVERSION_EVENTS,
  trackHomepageConversionEvent,
} from "@/lib/analytics/homepage-conversion-events";
import { useTranslation } from "@/lib/i18n";

interface BundlesShowcaseSectionProps {
  bundles: HomeBundle[];
  formatPrice: (price: number) => string;
}

function getBundleSavings(bundle: HomeBundle): number {
  if (
    typeof bundle.compareAtPrice === "number" &&
    bundle.compareAtPrice > bundle.price
  ) {
    return bundle.compareAtPrice - bundle.price;
  }

  if (
    typeof bundle.bundleDiscount === "number" &&
    bundle.bundleDiscount > 0 &&
    bundle.bundleDiscount < 100
  ) {
    const estimatedBasePrice = bundle.price / (1 - bundle.bundleDiscount / 100);
    return estimatedBasePrice - bundle.price;
  }

  return 0;
}

function isProbablyRomanian(text: string): boolean {
  return /[ăâîșț]/i.test(text) || /\b(și|pentru|copil|vârstă|pachet|joc|rapid)\b/i.test(text);
}

function looksEnglish(text: string): boolean {
  return /\b(and|for|with|the|plus|quick|bundle|games|challenge|practice|thinking|curiosity|imaginative)\b/i.test(
    text
  );
}

function getRomanianFallbackName(name: string): string {
  if (!name.trim()) return "Pachet STEM";
  if (/bundle/i.test(name)) {
    return name.replace(/bundle/gi, "Pachet");
  }
  return name;
}

function getRomanianFallbackDescription(description: string): string {
  if (description.trim() && isProbablyRomanian(description)) {
    return description;
  }

  if (looksEnglish(description)) {
    return "Pachet STEM complet pentru joacă practică, logică, creativitate și progres real acasă.";
  }

  return description.trim()
    ? description
    : "Pachet STEM complet pentru joacă practică, logică, creativitate și progres real acasă.";
}

function withStringFallback(
  primary: string | null | undefined,
  fallback: string
): string {
  return primary && primary.trim().length > 0 ? primary.trim() : fallback;
}

export const BundlesShowcaseSection = React.memo(
  ({ bundles, formatPrice }: BundlesShowcaseSectionProps) => {
    const { language } = useTranslation();
    const isRomanian = language === "ro";

    if (bundles.length === 0) {
      return null;
    }

    return (
      <section
        id="bundle-showcase"
        className="py-8 sm:py-12 md:py-14 lg:py-16"
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={`${glassPanelClass} border-sky-300/20 bg-gradient-to-br from-sky-950/70 via-slate-900/70 to-emerald-950/60 p-4 sm:p-6 lg:p-8`}
          >
            <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
                  {isRomanian
                    ? "Pachete speciale pentru familii istețe"
                    : "Special bundles for smart families"}
                </span>
                <h2 className="mt-3 bg-gradient-to-r from-amber-200 via-sky-100 to-emerald-200 bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl lg:text-4xl">
                  {isRomanian
                    ? "Mai multă valoare, mai puțin cost: alege un pachet STEM"
                    : "More value, lower cost: choose a STEM bundle"}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-200/85 sm:text-base">
                  {isRomanian
                    ? "Cu pachetele noastre obții produse care se completează perfect, progres clar pentru copil și un preț de pachet care îți păstrează bugetul sub control. Ideal când vrei impact mai mare cu o singură decizie."
                    : "Our bundles combine products that work better together, offer clear progress for your child, and keep your budget under control."}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100">
                {isRomanian
                  ? "Economisești mai mult când cumperi împreună"
                  : "Save more when you buy together"}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bundles.map((bundle, index) => {
                const savings = getBundleSavings(bundle);
                const displayName = isRomanian
                  ? withStringFallback(
                      bundle.nameRo,
                      getRomanianFallbackName(bundle.name)
                    )
                  : withStringFallback(bundle.nameEn, bundle.name);
                const displayDescription = isRomanian
                  ? withStringFallback(
                      bundle.descriptionRo,
                      getRomanianFallbackDescription(bundle.description)
                    )
                  : withStringFallback(bundle.descriptionEn, bundle.description);

                return (
                  <Link
                    key={bundle.id}
                    href={`/products/${bundle.slug}`}
                    onClick={() =>
                      trackHomepageConversionEvent(
                        HOMEPAGE_CONVERSION_EVENTS.BUNDLE_CARD_CLICK,
                        {
                          bundle_id: bundle.id,
                          bundle_slug: bundle.slug,
                          bundle_name: displayName,
                          bundle_price: bundle.price,
                          bundle_discount: bundle.bundleDiscount ?? 0,
                        }
                      )
                    }
                    data-conversion="cta"
                    data-conversion-type="click"
                    data-conversion-category="ecommerce"
                    data-conversion-action="bundle_card_click"
                    data-conversion-element={`bundle_card_${bundle.slug}`}
                    data-conversion-metadata={`{"bundleId":"${bundle.id}","bundleSlug":"${bundle.slug}","bundlePrice":${bundle.price}}`}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-3 shadow-xl shadow-black/25 transition-all duration-300 hover:-translate-y-1 hover:border-sky-300/50 hover:shadow-sky-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    aria-label={
                      isRomanian
                        ? `Vezi pachetul ${displayName}`
                        : `View bundle ${displayName}`
                    }
                    style={{
                      animationDelay: `${Math.min(index * 0.08, 0.2)}s`,
                    }}
                  >
                    {typeof bundle.bundleDiscount === "number" &&
                      bundle.bundleDiscount > 0 && (
                        <span className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                          -{Math.round(bundle.bundleDiscount)}%
                        </span>
                      )}

                    <div className="relative h-40 overflow-hidden rounded-xl">
                      <Image
                        src={bundle.images[0] || "/images/placeholder.png"}
                        alt={displayName}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="mt-4">
                      <h3 className="line-clamp-2 text-lg font-bold text-white">
                        {displayName}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-300/85">
                        {displayDescription}
                      </p>

                      <div className="mt-4 flex items-end justify-between gap-2">
                        <div>
                          <p className="text-xl font-extrabold text-emerald-200">
                            {formatPrice(bundle.price)}
                          </p>
                          {typeof bundle.compareAtPrice === "number" &&
                            bundle.compareAtPrice > bundle.price && (
                              <p className="text-xs text-slate-400 line-through">
                                {formatPrice(bundle.compareAtPrice)}
                              </p>
                            )}
                        </div>

                        <span className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 group-hover:from-sky-400 group-hover:to-indigo-400">
                          {isRomanian ? "Vezi pachetul" : "View bundle"}
                        </span>
                      </div>

                      {savings > 0 && (
                        <p className="mt-3 text-xs font-medium text-amber-200">
                          {isRomanian
                            ? `Economie estimată: ${formatPrice(savings)}`
                            : `Estimated savings: ${formatPrice(savings)}`}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 flex justify-center">
              <Link
                href="/products?bundleView=bundles"
                onClick={() =>
                  trackHomepageConversionEvent(
                    HOMEPAGE_CONVERSION_EVENTS.BUNDLE_LIST_CTA_CLICK,
                    {
                      cta_label: isRomanian
                        ? "Vezi toate pachetele și economiile active"
                        : "See all bundles and current savings",
                      target_href: "/products?bundleView=bundles",
                    }
                  )
                }
                data-conversion="cta"
                data-conversion-type="click"
                data-conversion-category="ecommerce"
                data-conversion-action="bundle_list_cta_click"
                data-conversion-element="bundle_list_cta"
                className="inline-flex items-center justify-center rounded-xl border border-amber-300/30 bg-amber-300/10 px-5 py-2.5 text-sm font-bold text-amber-100 transition hover:border-amber-200/50 hover:bg-amber-300/20"
              >
                {isRomanian
                  ? "Vezi toate pachetele și economiile active"
                  : "See all bundles and current savings"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

BundlesShowcaseSection.displayName = "BundlesShowcaseSection";
