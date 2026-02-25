"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

import { buildProductsUrl } from "@/lib/utils/product-filters-url";

interface Category {
  name: string;
  description: string;
  slug: string;
  image: string;
  productFilterCategory?: string | string[];
}

interface CategoriesSectionProps {
  categories: Category[];
  t: (key: string, defaultValue?: string) => string;
}

function getCategoryHref(category: Category): string {
  if (category.productFilterCategory) {
    return buildProductsUrl({ category: category.productFilterCategory });
  }

  // Safe fallback: normalize from the slug/name into /products filters.
  return buildProductsUrl({ category: category.slug || category.name });
}

const accentByIndex = [
  "from-amber-300/75 via-orange-200/60 to-white/20",
  "from-sky-300/70 via-cyan-200/55 to-white/20",
  "from-lime-300/70 via-emerald-200/55 to-white/20",
  "from-yellow-300/70 via-amber-200/55 to-white/20",
];

const CategoriesSectionComponent = ({
  categories,
  t,
}: CategoriesSectionProps) => {
  const spotlightCategories = categories.slice(0, 4);

  return (
    <section className="h-full py-2 sm:py-3 md:py-4">
      <div className="h-full rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_16px_38px_-24px_rgba(30,64,175,0.22)] sm:p-5 lg:p-6">
        <div className="mb-4 text-center sm:mb-5">
          <div className="flex items-center gap-3">
            <div className="hidden h-px flex-1 bg-slate-200 sm:block" />
            <h2 className="text-xl font-black tracking-tight text-blue-900 sm:text-2xl">
              {t("shopByCategory", "Shop by Category")}
            </h2>
            <div className="hidden h-px flex-1 bg-slate-200 sm:block" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {spotlightCategories.map((category, index) => (
            <Link
              key={`${category.slug}-${category.name}`}
              href={getCategoryHref(category)}
              className="group overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_14px_30px_-18px_rgba(59,130,246,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={`${t("viewCategory", "View category")}: ${category.name}`}
            >
              <div className="relative h-24 overflow-hidden sm:h-28 lg:h-32">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/15 via-transparent to-transparent" />
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-r ${
                    accentByIndex[index % accentByIndex.length]
                  }`}
                  aria-hidden
                />
              </div>
              <div className="border-t border-slate-200 bg-white px-2.5 py-2 text-center sm:px-3">
                <h3 className="text-xs font-black leading-tight text-blue-900 sm:text-sm">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export const CategoriesSection = React.memo(CategoriesSectionComponent);
