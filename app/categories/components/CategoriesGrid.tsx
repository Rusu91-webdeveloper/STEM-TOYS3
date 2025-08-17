"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useTranslation, TranslationKey } from "@/lib/i18n";

export interface CategoryData {
  id: string;
  name: string;
  nameKey: string;
  description: string;
  slug: string;
  image: string;
  productCount: number;
  isActive: boolean;
}

// Add a mapping from slug to the correct query value for the products page
export const slugToQueryCategory: Record<string, string> = {
  science: "science",
  technology: "technology",
  engineering: "engineering",
  math: "mathematics", // Fix: math → mathematics
  "educational-books": "educational-books",
};

interface CategoriesGridProps {
  categories: CategoryData[];
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  const { t } = useTranslation();

  const handleCategoryClick = (categorySlug: string) => {
    // Analytics tracking can be added here
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "category_clicked", {
        category: categorySlug,
        page: "categories",
      });
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 md:space-y-24">
      {categories.map((category, index) => (
        <div
          key={category.slug}
          className={`relative flex flex-col sm:flex-row ${
            index % 2 !== 0 ? "sm:flex-row-reverse" : ""
          } gap-0 sm:gap-8 md:gap-12 items-stretch transition-all duration-500 hover:scale-[1.02] shadow-lg hover:shadow-xl rounded-xl sm:rounded-2xl overflow-hidden
            w-full mx-2 sm:mx-0 md:w-full
            bg-background
            p-0 sm:px-8 sm:py-10 md:px-12 md:py-14
          `}
          style={{ maxWidth: "100vw", minHeight: "min(340px, 60vw)" }}
        >
          {/* Image section */}
          <div className="relative w-full sm:w-2/5 h-[160px] sm:h-auto flex-shrink-0 flex-grow-0">
            <div className="relative h-full w-full min-h-[120px] sm:min-h-0 overflow-hidden rounded-t-xl sm:rounded-t-none sm:rounded-l-2xl shadow-lg">
              <Image
                src={category.image}
                alt={`${category.name} category of STEM toys`}
                fill
                priority
                sizes="(max-width: 640px) 100vw, 40vw"
                style={{ objectFit: "cover" }}
                className="transition-transform hover:scale-105 duration-700"
              />
            </div>
          </div>

          {/* Text/content section */}
          <div className="w-full sm:w-3/5 flex flex-col justify-center space-y-3 sm:space-y-4 md:space-y-6 p-4 sm:p-8 md:p-10">
            <div className="inline-flex items-center px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium rounded-full bg-primary/10 text-primary">
              {t("categoryProducts").replace(
                "{0}",
                category.productCount.toString()
              )}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground/90">
              {category.name}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed">
              {t(category.description as TranslationKey)}
            </p>
            <div className="pt-2 sm:pt-4">
              <Button
                asChild
                size="lg"
                className="rounded-full font-medium h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base px-4 sm:px-6 bg-gradient-to-r from-primary to-secondary text-white hover:from-secondary hover:to-primary"
                onClick={() => handleCategoryClick(category.slug)}
              >
                <Link
                  href={`/products?category=${slugToQueryCategory[category.slug] || category.slug}`}
                >
                  {t("explorerCategoryToys").replace("{0}", category.name)}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
