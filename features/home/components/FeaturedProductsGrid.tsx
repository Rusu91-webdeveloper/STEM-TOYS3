"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

import { gradientButtonClass } from "@/features/home/components/homeTheme";
import { useCurrency } from "@/lib/currency";
import type { Product } from "@/types/product";

interface FeaturedProductsGridProps {
  products: Product[];
  t: (key: string, defaultValue?: string) => string;
  isLoading?: boolean;
}

function getProductImage(product: Product): string {
  return product.images && product.images.length > 0
    ? product.images[0]
    : "/placeholder-product.png";
}

export const FeaturedProductsGrid = React.memo(
  ({ products, t, isLoading = false }: FeaturedProductsGridProps) => {
    const { formatPrice } = useCurrency();
    const showcaseProducts = products.slice(0, 4);

    if (isLoading || showcaseProducts.length === 0) {
      return (
        <section className="py-4 sm:py-6 md:py-8">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_38px_-24px_rgba(15,23,42,0.18)] sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="hidden h-px flex-1 bg-slate-200 sm:block" />
                <h2 className="text-xl font-black tracking-tight text-blue-900 sm:text-2xl">
                  {t("featuredProducts", "Featured Products")}
                </h2>
                <div className="hidden h-px flex-1 bg-slate-200 sm:block" />
              </div>
              <p className="text-center text-sm font-medium text-slate-500">
                {t("noFeaturedProducts", "No featured products found.")}
              </p>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="py-4 sm:py-6 md:py-8">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#edf5ff_100%)] p-3 shadow-[0_16px_38px_-24px_rgba(15,23,42,0.18)] sm:p-4">
            <div className="mb-3 flex items-center gap-3 sm:mb-4">
              <div className="hidden h-px flex-1 bg-slate-300 sm:block" />
              <h2 className="text-xl font-black tracking-tight text-blue-900 sm:text-2xl">
                {t("featuredProducts", "Featured Products")}
              </h2>
              <div className="hidden h-px flex-1 bg-slate-300 sm:block" />
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Link
                href="/products?bundleView=bundles"
                className="group relative col-span-2 overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-600 p-4 text-white shadow-[0_18px_30px_-18px_rgba(30,64,175,0.55)] lg:col-span-1"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15 blur-xl" />
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-100">
                  Bundle Offer
                </p>
                <h3 className="mt-2 text-2xl font-black leading-tight">
                  Save 10%
                </h3>
                <p className="mt-1 text-sm font-semibold text-blue-100">
                  on STEM Bundles
                </p>
                <p className="mt-3 text-xs text-blue-100/90">
                  Shop curated bundles with a better price than buying items separately.
                </p>
                <span className="mt-4 inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white transition group-hover:bg-orange-400">
                  {t("ctaShopNow", "Shop Now")}
                </span>
              </Link>

              {showcaseProducts.map((product) => {
                const compareAtPrice =
                  typeof product.compareAtPrice === "number" &&
                  product.compareAtPrice > product.price
                    ? product.compareAtPrice
                    : null;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_28px_-20px_rgba(59,130,246,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <div className="relative h-24 overflow-hidden sm:h-28 lg:h-32">
                      <Image
                        src={getProductImage(product)}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="px-2.5 py-2.5 sm:px-3">
                      <h3 className="line-clamp-2 min-h-[2rem] text-xs font-bold leading-tight text-blue-900 sm:text-sm">
                        {product.name}
                      </h3>

                      <div className="mt-2 flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-base font-black text-red-500">
                            {formatPrice(product.price)}
                          </p>
                          {compareAtPrice && (
                            <p className="text-[10px] text-slate-400 line-through sm:text-xs">
                              {formatPrice(compareAtPrice)}
                            </p>
                          )}
                        </div>

                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                          {t("viewDetails", "Shop")}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-5 text-center">
              <Link
                href="/products"
                className={`${gradientButtonClass} inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold`}
              >
                {t("viewAllProducts", "View All Products")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

FeaturedProductsGrid.displayName = "FeaturedProductsGrid";
