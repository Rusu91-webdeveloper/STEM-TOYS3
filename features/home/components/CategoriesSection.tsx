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
  "from-amber-200/85 via-orange-100/65 to-white/15",
  "from-sky-200/80 via-cyan-100/60 to-white/15",
  "from-emerald-200/80 via-lime-100/60 to-white/15",
  "from-indigo-200/80 via-sky-100/60 to-white/15",
];

const CategoriesSectionComponent = ({
  categories,
  t,
}: CategoriesSectionProps) => {
  const spotlightCategories = categories.slice(0, 4);

  return (
    <section className="h-full py-2 sm:py-3 md:py-4">
      <div className="h-full rounded-[1.5rem] border border-slate-200/80 bg-white/88 p-3.5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.16)] backdrop-blur-sm sm:rounded-[2rem] sm:p-5 lg:p-6">
        <div className="mb-4 sm:mb-6">
          <span className="inline-flex rounded-full border border-sky-200/80 bg-sky-50/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-sky-700">
            Selectie rapida
          </span>
          <div className="mt-3 flex items-center gap-3">
            <h2 className="text-[1.55rem] font-black tracking-[-0.04em] text-slate-950 sm:text-[2.2rem]">
              {t("shopByCategory", "Alege dupa categorie")}
            </h2>
            <div className="hidden h-px flex-1 bg-slate-200 sm:block" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {spotlightCategories.map((category, index) => (
            <Link
              key={`${category.slug}-${category.name}`}
              href={getCategoryHref(category)}
              className="group overflow-hidden rounded-[1.2rem] border border-slate-200/90 bg-white/96 shadow-[0_12px_30px_-26px_rgba(15,23,42,0.18)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_44px_-32px_rgba(15,23,42,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:rounded-[1.5rem]"
              aria-label={`${t("viewCategory", "View category")}: ${category.name}`}
            >
              <div className="relative h-24 overflow-hidden sm:h-32 lg:h-36">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/15 via-transparent to-transparent" />
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-r ${
                    accentByIndex[index % accentByIndex.length]
                  }`}
                  aria-hidden
                />
              </div>
              <div className="border-t border-slate-100 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
                <h3 className="text-[0.95rem] font-black leading-tight tracking-[-0.02em] text-slate-950 sm:text-base">
                  {category.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-[11px] leading-[1.35] text-slate-500 sm:text-sm sm:leading-5">
                  {category.description}
                </p>
                <span className="mt-2 inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700 sm:mt-3 sm:text-xs sm:tracking-[0.16em]">
                  Vezi selectie
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export const CategoriesSection = React.memo(CategoriesSectionComponent);
