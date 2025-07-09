"use client";

import React from "react";
import Image from "next/image";

interface Category {
  name: string;
  description: string;
  slug: string;
  image: string;
}

interface CategoriesSectionProps {
  categories: Category[];
  t: (key: string, defaultValue?: string) => string;
}

const CategoriesSectionComponent = ({
  categories,
  t,
}: CategoriesSectionProps) => {
  return (
    <section className="py-10 bg-muted">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
          {t("stemCategories")}
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-3xl mx-auto px-2">
          {t("stemCategoriesDesc")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
          {categories.map(category => (
            <a
              href={`/products?category=${category.slug}`}
              key={category.slug}
              aria-label={`Explore ${category.name} category`}
              className="bg-background rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px] h-full flex flex-col"
            >
              <div className="relative h-32 sm:h-40 md:h-48 w-full">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-3 sm:p-4 md:p-5 flex flex-col flex-grow">
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2">
                  {category.name}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base mb-3 sm:mb-4">
                  {category.description}
                </p>
                <div className="mt-auto">
                  <span className="text-primary text-xs sm:text-sm font-medium inline-flex items-center">
                    {t("exploreCategories").split(" ")[0]} {category.name}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export const CategoriesSection = React.memo(CategoriesSectionComponent);
