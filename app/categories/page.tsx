"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation, TranslationKey } from "@/lib/i18n";

// Category data with translation keys
const categoryDescKeys: Record<string, TranslationKey> = {
  science: "scienceCategoryDesc",
  technology: "technologyCategoryDesc",
  engineering: "engineeringCategoryDesc",
  math: "mathCategoryDesc",
  "educational-books": "educationalBook", // Fixed to use existing translation key
};

// Static data for fallback with translated names
const categoryData = [
  {
    nameKey: "Science",
    description: "scienceCategoryDesc",
    slug: "science",
    image: "/images/category_banner_science_01.png",
  },
  {
    nameKey: "Technology",
    description: "technologyCategoryDesc",
    slug: "technology",
    image: "/images/category_banner_technology_01.png",
  },
  {
    nameKey: "Engineering",
    description: "engineeringCategoryDesc",
    slug: "engineering",
    image: "/images/category_banner_engineering_01.png",
  },
  {
    nameKey: "Math",
    description: "mathCategoryDesc",
    slug: "math",
    image: "/images/category_banner_math_01.png",
  },
  {
    nameKey: "Educational Books",
    description: "educationalBook", // Fixed to use existing translation key
    slug: "educational-books",
    image: "/images/category_banner_books_01.jpg",
  },
];

interface Category {
  nameKey: string;
  name: string;
  description: string;
  slug: string;
  image: string;
  productCount: number;
}

// Add a mapping from slug to the correct query value for the products page
const slugToQueryCategory: Record<string, string> = {
  science: "science",
  technology: "technology",
  engineering: "engineering",
  math: "mathematics", // Fix: math → mathematics
  "educational-books": "educational-books", // Add books category
};

export default function CategoriesPage() {
  const { t, language } = useTranslation();
  const [categories, setCategories] = useState<Category[]>(
    categoryData.map(cat => ({
      ...cat,
      name: cat.nameKey, // Initial name from key
      productCount: 0,
    }))
  );
  const [isLoading, setIsLoading] = useState(true);

  // Helper to translate category names based on language
  const getCategoryName = (slug: string): string => {
    switch (slug) {
      case "science":
        return language === "ro" ? "Știință" : "Science";
      case "technology":
        return language === "ro" ? "Tehnologie" : "Technology";
      case "engineering":
        return language === "ro" ? "Inginerie" : "Engineering";
      case "math":
        return language === "ro" ? "Matematică" : "Math";
      case "educational-books":
        return language === "ro" ? "Cărți Educaționale" : "Educational Books";
      default:
        return slug;
    }
  };

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/categories", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const dbCategories = await response.json();

        // Map database categories to our display categories with correct images and descriptions
        const updatedCategories = categoryData.map(displayCat => {
          const dbCategory = dbCategories.find(
            (dbCat: any) =>
              dbCat.slug.toLowerCase() === displayCat.slug.toLowerCase()
          );

          return {
            ...displayCat,
            name: getCategoryName(displayCat.slug),
            productCount: dbCategory?.productCount || 0,
          };
        });

        setCategories(updatedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, [language]); // Refetch when language changes

  // Update category names when language changes
  useEffect(() => {
    setCategories(prev =>
      prev.map(cat => ({
        ...cat,
        name: getCategoryName(cat.slug),
      }))
    );
  }, [language]);

  return (
    <div className="container mx-auto px-0 sm:px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-6 text-center bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
        {t("stemCategories")}
      </h1>
      <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-8 sm:mb-16 text-sm sm:text-base md:text-lg">
        {t("stemCategoriesDesc")}
      </p>

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
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <Image
                    src={category.image}
                    alt={`${category.name} category of STEM toys`}
                    fill
                    priority
                    sizes="(max-width: 640px) 100vw, 40vw"
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105 duration-700"
                  />
                )}
              </div>
            </div>

            {/* Text/content section */}
            <div className="w-full sm:w-3/5 flex flex-col justify-center space-y-3 sm:space-y-4 md:space-y-6 p-4 sm:p-8 md:p-10">
              {isLoading ? (
                <>
                  <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
                  <Skeleton className="h-8 sm:h-12 w-48 sm:w-64" />
                  <Skeleton className="h-16 sm:h-24 w-full" />
                  <Skeleton className="h-8 sm:h-10 w-32 sm:w-40" />
                </>
              ) : (
                <>
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
                    >
                      <Link
                        href={`/products?category=${slugToQueryCategory[category.slug] || category.slug}`}
                      >
                        {t("explorerCategoryToys").replace(
                          "{0}",
                          category.name
                        )}
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
