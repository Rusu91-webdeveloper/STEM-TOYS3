import { cookies } from "next/headers";
import { Suspense } from "react";

import { getTranslation } from "@/lib/i18n/server";
import {
  getCategories,
  generateCategoriesStructuredData,
} from "@/lib/services/categories-service";

import { CategoriesGrid } from "./components/CategoriesGrid";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { CategoriesSkeleton } from "./components/CategoriesSkeleton";
import {
  glassPanelClass,
  homeBackgroundClass,
  homeContentWrapperClass,
  homeOverlayBottomClass,
  homeOverlayTopClass,
} from "@/features/home/components/homeTheme";

// Enable ISR with 5 minute revalidation
export const revalidate = 300;

// Generate static params for supported locales
export function generateStaticParams() {
  return [{ locale: "ro" }, { locale: "en" }];
}

async function CategoriesContent({ locale }: { locale: string }) {
  const categories = await getCategories(locale);
  const t = getTranslation(locale);

  return (
    <div className={homeBackgroundClass}>
      <div className={homeOverlayTopClass} aria-hidden />
      <div className={homeOverlayBottomClass} aria-hidden />
      <div className={homeContentWrapperClass}>
        <header className="container relative mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
          <div
            className={`${glassPanelClass} mx-auto max-w-4xl px-6 py-8 sm:px-10 sm:py-10 text-center`}
          >
            <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
              {t("stemCategories")}
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
              {t("categoriesH1")}
            </h1>
            <p className="mt-4 text-sm text-slate-200/80 sm:text-base md:text-lg">
              {t("stemCategoriesDesc")}
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 pb-16 sm:px-6 sm:pb-20">
          <CategoriesGrid categories={categories} />
        </main>

        {/* Structured Data for SEO */}
        <SeoJsonLd data={generateCategoriesStructuredData(categories)} />
      </div>
    </div>
  );
}

export default async function CategoriesPage() {
  // Get locale from cookies or default to 'ro' (Romanian)
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "ro";

  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesContent locale={locale} />
    </Suspense>
  );
}
