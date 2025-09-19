"use client";

import Image from "next/image";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Tag } from "lucide-react";

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

          {/* Product accordion */}
          <div
            className="relative mx-auto max-w-5xl"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Product display */}
            <div className="overflow-hidden relative rounded-xl shadow-lg border border-gray-200 bg-white">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="flex flex-col md:flex-row"
                >
                  {/* Product image */}
                  <div className="relative h-48 sm:h-56 md:h-80 md:w-1/2 overflow-hidden">
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
                      className="object-cover w-full h-full rounded-t-xl md:rounded-t-none md:rounded-l-xl"
                      priority
                      loading="eager"
                    />
                    <div className="absolute top-2 left-2 bg-indigo-600 text-white rounded-full px-3 py-1 text-xs font-medium flex items-center">
                      <Tag size={12} className="mr-1" />
                      {t("featured", "Featured")}
                    </div>
                  </div>

                  {/* Product details */}
                  <div className="p-4 sm:p-6 md:p-8 md:w-1/2 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-2 sm:mb-4">
                        {products[activeIndex].name}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                        {products[activeIndex].description}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-auto">
                      <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-indigo-600 mb-2 sm:mb-0">
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
                        className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3 rounded-md font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 w-full sm:w-auto text-center"
                      >
                        {t("viewDetails")}
                      </a>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation buttons */}
              <button
                onClick={prevProduct}
                className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 backdrop-blur-sm z-10"
                aria-label="Previous product"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>

              <button
                onClick={nextProduct}
                className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 backdrop-blur-sm z-10"
                aria-label="Next product"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* Product indicators */}
            <div className="flex justify-center mt-4 sm:mt-6">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToProduct(index)}
                  className={`mx-1 h-2 w-2 sm:h-3 sm:w-3 rounded-full focus:outline-none ${
                    index === activeIndex
                      ? "bg-indigo-600 w-4 sm:w-6"
                      : "bg-gray-300 hover:bg-gray-400"
                  } transition-all duration-300`}
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
