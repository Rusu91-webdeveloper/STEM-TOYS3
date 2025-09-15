"use client";

import Image from "next/image";
import Link from "next/link";

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

interface CategoriesGridProps {
  categories: CategoryData[];
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
      {categories.map((category, index) => (
        <Link
          href={`/categories/${category.slug}`}
          key={category.slug}
          className="group block"
          prefetch
        >
          <div className="relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02] border border-gray-100 dark:border-gray-700">
            {/* Image section */}
            <div className="relative w-full h-48 sm:h-56 md:h-64">
              <Image
                src={category.image}
                alt={`${category.name} category of STEM toys`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
                className="transition-transform group-hover:scale-105 duration-500"
              />
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

              {/* Category badge */}
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-900 backdrop-blur-sm">
                  {category.productCount} produse
                </span>
              </div>
            </div>

            {/* Content section */}
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {category.name}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                {t(category.description as TranslationKey)}
              </p>

              {/* Educational benefits - simplified for mobile */}
              <div className="space-y-2">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Beneficii Educaționale
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {getCategoryBenefits(category.slug)
                    .slice(0, 3)
                    .map((benefit, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      >
                        {benefit}
                      </span>
                    ))}
                  {getCategoryBenefits(category.slug).length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      +{getCategoryBenefits(category.slug).length - 3} mai multe
                    </span>
                  )}
                </div>
              </div>

              {/* CTA Arrow */}
              <div className="mt-4 flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
                Explorează categoria
                <svg
                  className="ml-1 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Helper function to get category benefits
function getCategoryBenefits(slug: string): string[] {
  const benefits: Record<string, string[]> = {
    science: [
      "Curiozitate științifică",
      "Experimente practice",
      "Gândire critică",
      "Fizică & Chimie",
    ],
    technology: ["Programare", "Robotică", "AI & Inovație", "Cariere viitor"],
    engineering: [
      "Mecanică",
      "Rezolvare probleme",
      "Creativitate",
      "Proiectare",
    ],
    math: [
      "Matematică distractivă",
      "Gândire logică",
      "Concepte prin joc",
      "Încredere",
    ],
    "educational-books": [
      "Dragoste învățare",
      "Vocabular",
      "Concepte STEM",
      "Imaginație",
    ],
  };

  return benefits[slug] || [];
}
