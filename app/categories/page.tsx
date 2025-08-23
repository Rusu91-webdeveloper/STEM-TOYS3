import { cookies } from "next/headers";
import { Suspense } from "react";

import { getTranslation } from "@/lib/i18n/server";
import {
  getCategories,
  generateCategoriesStructuredData,
} from "@/lib/services/categories-service";

import { CategoriesGrid } from "./components/CategoriesGrid";
import { CategoriesSkeleton } from "./components/CategoriesSkeleton";

// Enable ISR with 5 minute revalidation
export const revalidate = 300;

// Generate static params for supported locales
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ro" }];
}

interface CategoriesPageProps {
  params?: { locale?: string };
  _searchParams?: { [key: string]: string | string[] | undefined };
}

async function CategoriesContent({ locale }: { locale: string }) {
  const categories = await getCategories(locale);
  const t = getTranslation(locale);

  return (
    <div className="container mx-auto px-0 sm:px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-6 text-center bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
        {t("stemCategories")}
      </h1>
      <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-8 sm:mb-16 text-sm sm:text-base md:text-lg">
        {t("stemCategoriesDesc")}
      </p>

      <CategoriesGrid categories={categories} />

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateCategoriesStructuredData(categories)),
        }}
      />
    </div>
  );
}

export default async function CategoriesPage({
  params,
  _searchParams,
}: CategoriesPageProps) {
  // Get locale from cookies or default to 'en'
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? params?.locale ?? "en";

  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesContent locale={locale} />
    </Suspense>
  );
}
