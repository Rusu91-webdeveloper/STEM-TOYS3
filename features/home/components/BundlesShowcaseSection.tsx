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

export const BundlesShowcaseSection = React.memo(
  ({ bundles, formatPrice }: BundlesShowcaseSectionProps) => {
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
                  Pachete speciale pentru familii istețe
                </span>
                <h2 className="mt-3 bg-gradient-to-r from-amber-200 via-sky-100 to-emerald-200 bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl lg:text-4xl">
                  Mai multă valoare, mai puțin cost: alege un pachet STEM
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-200/85 sm:text-base">
                  Cu pachetele noastre obții produse care se completează
                  perfect, progres clar pentru copil și un preț de pachet care
                  îți păstrează bugetul sub control. Ideal când vrei impact mai
                  mare cu o singură decizie.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100">
                Economisești mai mult când cumperi împreună
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bundles.map((bundle, index) => {
                const savings = getBundleSavings(bundle);

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
                          bundle_name: bundle.name,
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
                    aria-label={`Vezi pachetul ${bundle.name}`}
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
                        alt={bundle.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="mt-4">
                      <h3 className="line-clamp-2 text-lg font-bold text-white">
                        {bundle.name}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-300/85">
                        {bundle.description}
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
                          Vezi pachetul
                        </span>
                      </div>

                      {savings > 0 && (
                        <p className="mt-3 text-xs font-medium text-amber-200">
                          Economie estimată: {formatPrice(savings)}
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
                      cta_label: "Vezi toate pachetele și economiile active",
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
                Vezi toate pachetele și economiile active
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

BundlesShowcaseSection.displayName = "BundlesShowcaseSection";
