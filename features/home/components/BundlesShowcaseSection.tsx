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
    const bundlePromoPercent = 10;

    if (bundles.length === 0) {
      return null;
    }

    return (
      <section
        id="bundle-showcase"
        className="py-3 sm:py-5 md:py-6 lg:py-8"
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={`${glassPanelClass} border-blue-100 bg-white/95 p-4 shadow-[0_22px_60px_-28px_rgba(30,64,175,0.32)] backdrop-blur-sm sm:p-6 lg:p-8`}
          >
            <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-blue-700">
                  {isRomanian
                    ? `Reducere ${bundlePromoPercent}% la bundle-uri`
                    : `${bundlePromoPercent}% off STEM bundles`}
                </span>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-blue-900 sm:text-3xl lg:text-4xl">
                  {isRomanian
                    ? "Alege un bundle STEM și economisește instant"
                    : "Choose a STEM bundle and save instantly"}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                  {isRomanian
                    ? "Bundle-urile combină produse care funcționează bine împreună și îți oferă preț mai bun decât cumpărarea separată."
                    : "Bundles combine products that work better together and give you a better deal than buying separately."}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                {isRomanian
                  ? `Oferta home page: -${bundlePromoPercent}% la bundle`
                  : `Homepage offer: ${bundlePromoPercent}% off bundles`}
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
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_16px_32px_-20px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_40px_-24px_rgba(59,130,246,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={
                      isRomanian
                        ? `Vezi pachetul ${displayName}`
                        : `View bundle ${displayName}`
                    }
                    style={{
                      animationDelay: `${Math.min(index * 0.08, 0.2)}s`,
                    }}
                  >
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-2.5 py-1 text-xs font-extrabold text-white shadow-lg">
                      {isRomanian
                        ? `BUNDLE -${bundlePromoPercent}%`
                        : `BUNDLE ${bundlePromoPercent}% OFF`}
                    </span>

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
                      <h3 className="line-clamp-2 text-lg font-bold text-slate-900">
                        {displayName}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                        {displayDescription}
                      </p>

                      <div className="mt-4 flex items-end justify-between gap-2">
                        <div>
                          <p className="text-xl font-extrabold text-blue-900">
                            {formatPrice(bundle.price)}
                          </p>
                          {typeof bundle.compareAtPrice === "number" &&
                            bundle.compareAtPrice > bundle.price && (
                              <p className="text-xs text-slate-400 line-through">
                                {formatPrice(bundle.compareAtPrice)}
                              </p>
                            )}
                        </div>

                        <span className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2 text-xs font-bold text-white transition-all duration-200 group-hover:from-blue-500 group-hover:to-cyan-400">
                          {isRomanian ? "Vezi pachetul" : "View bundle"}
                        </span>
                      </div>

                      {savings > 0 && (
                        <p className="mt-3 text-xs font-semibold text-amber-700">
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
                className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
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
