"use client";

import React from "react";
import { ProductCard } from "@/features/products/components/ProductCard";
import type { Product } from "@/types/product";
import { glassPanelClass } from "@/features/home/components/homeTheme";

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

          {/* Products Grid */}
          <div className={`${glassPanelClass} p-4 sm:p-6 md:p-8`}>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {products.map((product, index) => {
                // Map averageRating to rating for ProductCard compatibility
                const productWithRating = {
                  ...product,
                  rating: product.averageRating,
                };
                return (
                  <div
                    key={product.id}
                    className="animate-fadeIn"
                    style={{
                      animationDelay: `${Math.min(index * 0.1, 0.5)}s`,
                    }}
                  >
                    <ProductCard
                      product={productWithRating as Product}
                      layout="grid"
                      priority={index < 4} // First 4 products are priority for LCP
                      className="h-full"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* View All Products CTA */}
          {products.length > 0 && (
            <div className="mt-8 sm:mt-10 md:mt-12 text-center">
              <a
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
