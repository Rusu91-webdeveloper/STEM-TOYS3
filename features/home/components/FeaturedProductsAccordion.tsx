"use client";

import Image from "next/image";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Tag } from "lucide-react";
import {
  // glassCardClass,
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images?: string[];
}

interface FeaturedProductsAccordionProps {
  products: Product[];
  formatPrice: (price: number) => string;
  t: (key: string, defaultValue?: string) => string;
  isLoading?: boolean;
}

export const FeaturedProductsAccordion = React.memo(
  ({
    products,
    formatPrice,
    t,
    isLoading = false,
  }: FeaturedProductsAccordionProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-rotate products every 5 seconds
    useEffect(() => {
      if (products.length <= 1 || isPaused) return;

      const rotateProducts = () => {
        setActiveIndex(prevIndex => (prevIndex + 1) % products.length);
      };

      intervalRef.current = setInterval(rotateProducts, 5000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [products.length, isPaused]);

    // Handle manual navigation
    const goToProduct = useCallback(
      (index: number) => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        setActiveIndex(index);

        // Resume auto-rotation after a pause
        intervalRef.current = setInterval(() => {
          setActiveIndex(prevIndex => (prevIndex + 1) % products.length);
        }, 5000);
      },
      [products.length]
    );

    const nextProduct = useCallback(() => {
      goToProduct((activeIndex + 1) % products.length);
    }, [activeIndex, goToProduct, products.length]);

    const prevProduct = useCallback(() => {
      goToProduct((activeIndex - 1 + products.length) % products.length);
    }, [activeIndex, goToProduct, products.length]);

    // Pause auto-rotation on hover
    const handleMouseEnter = () => setIsPaused(true);
    const handleMouseLeave = () => setIsPaused(false);

    // Debug log to verify we're receiving all products (development only)
    // Moved to useEffect to only log on mount/products change, not on every render
    useEffect(() => {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[ACCORDION] Received ${products.length} products:`,
          products.length,
          products.map(p => p.name)
        );
      }
    }, [products.length]); // Only log when products array length changes

    if (isLoading || products.length === 0) {
      return (
        <section className="py-4 sm:py-6 md:py-8 lg:py-10">
          <div className="container mx-auto px-2 sm:px-4 max-w-7xl">
            <div className="mb-3 sm:mb-4 md:mb-6 text-center">
              <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full mb-1 sm:mb-2">
                {t("recommendedForYou", "Recommended For You")}
              </span>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 sm:mb-3 md:mb-4 text-center mt-1 sm:mt-0 leading-tight">
                {t("featuredProducts")}
              </h2>
              <p className="text-center text-muted-foreground mb-4 sm:mb-6 md:mb-8 max-w-3xl mx-auto px-4 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed">
                {t("featuredProductsDesc")}
              </p>
            </div>

            <div className="text-center py-6 sm:py-12">
              <p className="text-muted-foreground text-xs sm:text-base">
                {t("noFeaturedProducts", "No featured products found.")}
              </p>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="py-4 sm:py-6 md:py-8 lg:py-10">
        <div className="container mx-auto max-w-7xl px-2 text-slate-100 sm:px-4">
          <div className="mb-5 text-center sm:mb-7">
            <span className="mb-2 inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200">
              {t("recommendedForYou", "Recommended For You")}
            </span>
            <h2 className="bg-gradient-to-r from-emerald-200 via-sky-200 to-indigo-200 bg-clip-text text-lg font-bold text-transparent sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl">
              {t("featuredProducts")}
            </h2>
            <p className="mt-3 text-xs text-slate-200/80 sm:text-sm md:text-base lg:text-lg">
              {t("featuredProductsDesc")}
            </p>
          </div>

          <div
            className="relative mx-auto max-w-5xl"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className={`${glassPanelClass} relative overflow-hidden`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="flex flex-col md:flex-row"
                >
                  <div className="relative h-48 overflow-hidden rounded-3xl border border-white/10 md:h-80 md:w-1/2 md:rounded-none md:rounded-l-3xl">
                    <Image
                      src={
                        products[activeIndex].images &&
                        products[activeIndex].images.length > 0
                          ? products[activeIndex].images[0]
                          : "/images/placeholder.png"
                      }
                      alt={products[activeIndex].name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="h-full w-full object-cover"
                      priority
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/25 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                      <Tag size={12} />
                      {t("featured", "Featured")}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-950/50 p-5 md:w-1/2 md:rounded-none md:rounded-r-3xl md:p-8">
                    <div>
                      <h3 className="text-base font-bold text-white sm:text-lg md:text-xl lg:text-2xl">
                        {products[activeIndex].name}
                      </h3>
                      <p className="mt-3 text-sm text-slate-200/80 sm:text-base">
                        {products[activeIndex].description}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-lg font-semibold text-emerald-200 sm:text-xl md:text-2xl">
                        {formatPrice(products[activeIndex].price)}
                      </span>
                      <a
                        href={`/products/${products[activeIndex].slug}`}
                        aria-label={`View details for ${products[activeIndex].name}`}
                        tabIndex={0}
                        data-conversion="cta"
                        data-conversion-type="click"
                        data-conversion-category="ecommerce"
                        data-conversion-action="view_product_details"
                        data-conversion-element={`featured_product_${products[activeIndex].slug}`}
                        data-conversion-metadata={`{"productId":"${products[activeIndex].id}","productName":"${products[activeIndex].name}","productSlug":"${products[activeIndex].slug}","price":${products[activeIndex].price}}`}
                        className={`${gradientButtonClass} inline-flex w-full items-center justify-center gap-2 px-5 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:w-auto`}
                      >
                        {t("viewDetails")}
                      </a>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <button
                onClick={prevProduct}
                className="absolute top-1/2 left-3 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                aria-label="Previous product"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={nextProduct}
                className="absolute top-1/2 right-3 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                aria-label="Next product"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex justify-center sm:mt-6">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToProduct(index)}
                  className={`mx-1 h-2 w-2 rounded-full focus:outline-none sm:h-3 sm:w-3 ${
                    index === activeIndex
                      ? "w-6 bg-emerald-300 sm:w-8"
                      : "bg-white/30 transition hover:bg-white/50"
                  }`}
                  aria-label={`Go to product ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : "false"}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
);

FeaturedProductsAccordion.displayName = "FeaturedProductsAccordion";
