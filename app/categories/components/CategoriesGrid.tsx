"use client";

import Image from "next/image";
import Link from "next/link";

import { useTranslation, TranslationKey } from "@/lib/i18n";
import {
  glassCardClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";

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
          className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          prefetch
        >
          <div
            className={`${glassCardClass} relative overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl`}
          >
            {/* Image section */}
            <div className="relative w-full h-48 sm:h-56 md:h-64">
              <Image
                src={category.image}
                alt={`${category.name} category of STEM toys`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
                className="transition-transform duration-700 group-hover:scale-105"
              />
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-950/10 to-indigo-500/20" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

              {/* Category badge */}
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]" />
                  {category.productCount} produse
                </span>
              </div>
            </div>

            {/* Content section */}
            <div className="flex flex-col p-5 sm:p-7">
              <h2 className="text-xl font-semibold text-white sm:text-2xl md:text-3xl">
                {category.name}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-200/80 sm:text-base">
                {t(category.description as TranslationKey)}
              </p>

              {/* Educational benefits */}
              <div className="mt-5 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300/90">
                  Beneficii Educaționale
                </h3>
                <div className="flex flex-wrap gap-2">
                  {getCategoryBenefits(category.slug)
                    .slice(0, 3)
                    .map((benefit, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-xl bg-sky-500/15 px-3 py-1 text-xs font-medium text-sky-200 shadow-[0_0_0_1px_rgba(56,189,248,0.18)] backdrop-blur"
                      >
                        {benefit}
                      </span>
                    ))}
                  {getCategoryBenefits(category.slug).length > 3 && (
                    <span className="inline-flex items-center rounded-xl bg-white/10 px-3 py-1 text-xs font-medium text-slate-200/80 shadow-[0_0_0_1px_rgba(148,163,184,0.12)] backdrop-blur">
                      +{getCategoryBenefits(category.slug).length - 3} mai multe
                    </span>
                  )}
                </div>
              </div>

              {/* CTA Arrow */}
              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400/80">
                  <span className="h-px w-8 bg-slate-500/40" aria-hidden />
                  STEM
                  <span className="h-px w-8 bg-slate-500/40" aria-hidden />
                </div>
                <span
                  className={`${gradientButtonClass} inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-wide shadow-lg shadow-sky-500/25`}
                >
                  Explorează categoria
                  <svg
                    className="h-4 w-4"
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
                </span>
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
