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
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] backdrop-blur-sm sm:p-6">
              <div className="mb-5">
                <span className="inline-flex rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700">
                  Editare manuala
                </span>
                <h2 className="mt-3 text-[1.9rem] font-black tracking-[-0.03em] text-slate-950 sm:text-[2.25rem]">
                  {t("featuredProducts", "Produse recomandate")}
                </h2>
              </div>
              <p className="text-center text-sm font-medium text-slate-500">
                {t("noFeaturedProducts", "Nu am gasit produse recomandate acum.")}
              </p>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="py-4 sm:py-6 md:py-8">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(247,251,255,0.96)_100%)] p-4 shadow-[0_26px_60px_-42px_rgba(15,23,42,0.18)] sm:p-5">
            <div className="mb-4 sm:mb-5">
              <span className="inline-flex rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700">
                Selectie editor
              </span>
              <div className="mt-3 flex items-center gap-3">
                <h2 className="text-[1.9rem] font-black tracking-[-0.03em] text-slate-950 sm:text-[2.25rem]">
                  {t("featuredProducts", "Produse recomandate")}
                </h2>
                <div className="hidden h-px flex-1 bg-slate-200 sm:block" />
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Produse cu cerere buna, valoare educationala clara si selectie usoara pentru parinti.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Link
                href="/products?bundleView=bundles"
                className="group relative col-span-2 overflow-hidden rounded-[1.55rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(15,118,110,0.96)_0%,rgba(3,105,161,0.96)_100%)] p-4 text-white shadow-[0_24px_44px_-26px_rgba(14,116,144,0.45)] lg:col-span-1"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15 blur-xl" />
                <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/75">
                  Pachet avantajos
                </p>
                <h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.03em]">
                  Economisesti 10%
                </h3>
                <p className="mt-1 text-sm font-semibold text-white/80">
                  la bundle-urile STEM
                </p>
                <p className="mt-3 text-xs leading-5 text-white/80">
                  Pachete pregatite pentru selectie rapida si pret mai bun decat separat.
                </p>
                <span className="mt-4 inline-flex items-center justify-center rounded-xl bg-white/14 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 transition group-hover:bg-white/20">
                  {t("ctaShopNow", "Vezi pachetele")}
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
                    className="group overflow-hidden rounded-[1.45rem] border border-slate-200/90 bg-white/98 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.18)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_22px_40px_-30px_rgba(15,23,42,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  >
                    <div className="relative h-28 overflow-hidden sm:h-32 lg:h-36">
                      <Image
                        src={getProductImage(product)}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="px-3 py-3 sm:px-4">
                      <h3 className="line-clamp-2 min-h-[2.4rem] text-sm font-black leading-tight tracking-[-0.02em] text-slate-950">
                        {product.name}
                      </h3>

                      <div className="mt-2 flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-lg font-black text-slate-950">
                            {formatPrice(product.price)}
                          </p>
                          {compareAtPrice && (
                            <p className="text-[10px] text-slate-400 line-through sm:text-xs">
                              {formatPrice(compareAtPrice)}
                            </p>
                          )}
                        </div>

                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
                          {t("viewDetails", "Vezi")}
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
                className={`${gradientButtonClass} inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-bold`}
              >
                {t("viewAllProducts", "Vezi toate produsele")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

FeaturedProductsGrid.displayName = "FeaturedProductsGrid";
