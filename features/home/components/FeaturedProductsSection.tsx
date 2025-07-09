"use client";

import React from "react";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images?: string[];
}

interface FeaturedProductsSectionProps {
  products: Product[];
  formatPrice: (price: number) => string;
  t: (key: string, defaultValue?: string) => string;
}

const FeaturedProductsSectionComponent = ({
  products,
  formatPrice,
  t,
}: FeaturedProductsSectionProps) => {
  return (
    <section className="py-10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8 text-center">
          <span className="inline-block px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full mb-2">
            {t("recommendedForYou", "Recommended For You")}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
            {t("featuredProducts")}
          </h2>
          <p className="text-center text-muted-foreground mb-0 max-w-3xl mx-auto px-2">
            {t("featuredProductsDesc")}
          </p>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t("noFeaturedProducts", "No featured products found.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {products.map(product => (
              <a
                href={`/products/${product.slug}`}
                key={product.id}
                aria-label={`View details for ${product.name}`}
                className="block"
              >
                <div className="bg-background rounded-lg overflow-hidden shadow-md border border-gray-200 transition-all duration-300 hover:shadow-xl h-full flex flex-col">
                  <div className="relative h-40 sm:h-52 w-full">
                    <Image
                      src={
                        product.images && product.images.length > 0
                          ? product.images[0]
                          : "/images/placeholder.png"
                      }
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col flex-grow">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2">
                      {product.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 flex-grow line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-sm sm:text-base md:text-lg font-bold">
                        {formatPrice(product.price)}
                      </span>
                      <span className="inline-block bg-indigo-600 text-white text-xs px-2 py-1 rounded ml-2">
                        {t("viewDetails")}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export const FeaturedProductsSection = React.memo(
  FeaturedProductsSectionComponent
);
