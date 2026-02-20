"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useCurrency } from "@/lib/currency";
import type { Product } from "@/types/product";
import {
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";

interface FeaturedProductsGridProps {
  products: Product[];
  t: (key: string, defaultValue?: string) => string;
  isLoading?: boolean;
}

/**
 * FeaturedProductsGrid - Modern e-commerce product showcase
 * Displays products in a responsive grid layout with modern styling
 * Perfect for showcasing toys on the homepage
 */
export const FeaturedProductsGrid = React.memo(
  ({ products, t, isLoading = false }: FeaturedProductsGridProps) => {
    const { formatPrice } = useCurrency();
    const [activeIndex, setActiveIndex] = React.useState(0);

    React.useEffect(() => {
      if (products.length === 0) {
        setActiveIndex(0);
        return;
      }
      if (activeIndex > products.length - 1) {
        setActiveIndex(0);
      }
    }, [activeIndex, products.length]);

    if (isLoading || products.length === 0) {
      return (
        <section className="py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="mb-6 sm:mb-8 md:mb-12 text-center">
              <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 text-xs font-semibold text-emerald-200 bg-white/10 border border-white/20 rounded-full mb-3 sm:mb-4 uppercase tracking-wide">
                {t("recommendedForYou", "Recommended For You")}
              </span>
              <h2 className="bg-gradient-to-r from-emerald-200 via-sky-200 to-indigo-200 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4">
                {t("featuredProducts", "Featured Products")}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-200/80 max-w-2xl mx-auto">
                {t(
                  "featuredProductsDesc",
                  "Discover our carefully curated selection of educational toys"
                )}
              </p>
            </div>

            <div className="text-center py-12">
              <p className="text-slate-300/70 text-sm sm:text-base">
                {t("noFeaturedProducts", "No featured products found.")}
              </p>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Section Header */}
          <div className="mb-6 sm:mb-8 md:mb-12 text-center">
            <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 text-xs font-semibold text-emerald-200 bg-white/10 border border-white/20 rounded-full mb-3 sm:mb-4 uppercase tracking-wide">
              {t("recommendedForYou", "Recommended For You")}
            </span>
            <h2 className="bg-gradient-to-r from-emerald-200 via-sky-200 to-indigo-200 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4">
              {t("featuredProducts", "Featured Products")}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-200/80 max-w-2xl mx-auto">
              {t(
                "featuredProductsDesc",
                "Discover our carefully curated selection of educational toys"
              )}
            </p>
          </div>

          {/* Desktop: single-row accordion */}
          <div className={`${glassPanelClass} p-2 sm:p-3 md:p-4`}>
            <div className="hidden md:flex items-stretch gap-2 lg:gap-3">
              {products.map((product, index) => {
                const imageSrc =
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : "/placeholder-product.png";
                const compareAtPrice =
                  product.compareAtPrice &&
                  product.compareAtPrice > product.price
                    ? product.compareAtPrice
                    : null;
                const isLowStock =
                  typeof product.stockQuantity === "number" &&
                  product.stockQuantity > 0 &&
                  product.stockQuantity <= 3;
                const disciplineLabel = product.stemDiscipline
                  ? product.stemDiscipline
                  : product.category?.name || t("featured", "Featured");
                const isActive = activeIndex === index;

                return (
                  <article
                    key={product.id}
                    className={`min-w-0 overflow-hidden rounded-2xl border transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                      isActive
                        ? "flex-[1.6_1_0%] border-emerald-200/35 shadow-lg shadow-emerald-950/30"
                        : "flex-[1_1_0%] border-white/15"
                    }`}
                  >
                    <Link
                      href={`/products/${product.slug}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onFocus={() => setActiveIndex(index)}
                      onKeyDown={event => {
                        if (event.key === "ArrowRight") {
                          event.preventDefault();
                          setActiveIndex(prev => (prev + 1) % products.length);
                        }
                        if (event.key === "ArrowLeft") {
                          event.preventDefault();
                          setActiveIndex(
                            prev =>
                              (prev - 1 + products.length) % products.length
                          );
                        }
                      }}
                      className="group relative flex h-[460px] flex-col justify-end outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                      aria-label={`${t("viewDetails", "View Details")}: ${product.name}`}
                    >
                      <Image
                        src={imageSrc}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 18vw, 220px"
                        className={`object-cover transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                          isActive
                            ? "scale-[1.02] saturate-95"
                            : "scale-100 saturate-[0.85]"
                        }`}
                        priority={index < 2}
                      />

                      <div
                        className={`absolute inset-0 transition-all duration-[900ms] motion-reduce:transition-none ${
                          isActive
                            ? "bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-900/20"
                            : "bg-gradient-to-t from-slate-950/92 via-slate-950/72 to-slate-900/40"
                        }`}
                        aria-hidden
                      />

                      {isLowStock && (
                        <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-900">
                          {t("lowStock", "Low Stock")}
                        </span>
                      )}

                      <div className="relative z-10 p-3 lg:p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/90">
                          {disciplineLabel}
                        </p>
                        <h3
                          className={`mt-1 min-h-[2.8rem] font-semibold leading-tight text-white transition-all duration-[800ms] motion-reduce:transition-none ${
                            isActive
                              ? "line-clamp-2 text-base lg:text-[1.05rem]"
                              : "line-clamp-2 text-sm"
                          }`}
                        >
                          {product.name}
                        </h3>

                        <div className="mt-3 flex items-end justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-base font-bold text-white lg:text-lg">
                              {formatPrice(product.price)}
                            </p>
                            {compareAtPrice && (
                              <p
                                className={`text-xs text-slate-300/80 line-through transition-opacity duration-[800ms] motion-reduce:transition-none ${
                                  isActive ? "opacity-100" : "opacity-70"
                                }`}
                              >
                                {formatPrice(compareAtPrice)}
                              </p>
                            )}
                          </div>

                          <span
                            className={`rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white transition-all duration-[800ms] motion-reduce:transition-none ${
                              isActive
                                ? "translate-x-0 opacity-100"
                                : "translate-x-0 opacity-70"
                            }`}
                          >
                            {t("viewDetails", "View Details")}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>

            {/* Mobile/tablet: one-row horizontal cards */}
            <div className="md:hidden overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-3 pr-2">
                {products.map(product => {
                  const imageSrc =
                    product.images && product.images.length > 0
                      ? product.images[0]
                      : "/placeholder-product.png";
                  const compareAtPrice =
                    product.compareAtPrice &&
                    product.compareAtPrice > product.price
                      ? product.compareAtPrice
                      : null;
                  const disciplineLabel = product.stemDiscipline
                    ? product.stemDiscipline
                    : product.category?.name || t("featured", "Featured");

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="relative h-[350px] w-[58vw] max-w-[248px] min-w-[210px] overflow-hidden rounded-2xl border border-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    >
                      <Image
                        src={imageSrc}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 68vw, 260px"
                        className="object-cover"
                        priority={false}
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-slate-900/15"
                        aria-hidden
                      />
                      <div className="absolute inset-x-0 bottom-0 z-10 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/90">
                          {disciplineLabel}
                        </p>
                        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-tight text-white">
                          {product.name}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-base font-bold text-white">
                            {formatPrice(product.price)}
                          </span>
                          {compareAtPrice && (
                            <span className="text-xs text-slate-300/80 line-through">
                              {formatPrice(compareAtPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* View All Products CTA */}
          {products.length > 0 && (
            <div className="mt-8 sm:mt-10 md:mt-12 text-center">
              <a
                href="/products"
                className={`${gradientButtonClass} inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 font-semibold transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
                aria-label={t("viewAllProducts", "View All Products")}
              >
                <span>{t("viewAllProducts", "View All Products")}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </a>
            </div>
          )}
        </div>
      </section>
    );
  }
);

FeaturedProductsGrid.displayName = "FeaturedProductsGrid";
