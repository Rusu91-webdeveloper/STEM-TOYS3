"use client";

import React, { Suspense } from "react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CategoriesSection } from "@/features/home/components/CategoriesSection";
import { FeaturedProductsSection } from "@/features/home/components/FeaturedProductsSection";
import { HeroSection } from "@/features/home/components/HeroSection";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import type { Product } from "@/types/product";



const EducationalBooksSection = React.lazy(
  () => import("@/features/home/components/EducationalBooksSection")
);
const ValuePropositionSection = React.lazy(
  () => import("@/features/home/components/ValuePropositionSection")
);

// This component now receives the initial featured products as a prop
export default function HomePageClient({
  initialFeaturedProducts,
}: {
  initialFeaturedProducts: Product[];
}) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  // STEM categories data
  const categories = [
    {
      name: "Science",
      description: "Discover the wonders of the natural world",
      slug: "science",
      image: "/images/category_banner_science_01.png",
    },
    {
      name: "Technology",
      description: "Explore coding, robotics, and digital innovation",
      slug: "technology",
      image: "/images/category_banner_technology_01.png",
    },
    {
      name: "Engineering",
      description: "Build, design, and solve problems",
      slug: "engineering",
      image: "/images/category_banner_engineering_01.png",
    },
    {
      name: "Mathematics",
      description: "Make numbers fun and engaging",
      slug: "math",
      image: "/images/category_banner_math_01.png",
    },
    {
      name: "Educational Books",
      description: "Educational books to inspire young minds",
      slug: "educational-books",
      image: "/images/category_banner_books_01.jpg",
    },
  ];

  // Translate category names and descriptions
  const translatedCategories = categories.map(category => ({
    ...category,
    name: t(category.name),
    description: t(`${category.slug}CategoryDesc`, category.description),
  }));

  return (
    <div className="flex flex-col">
      <HeroSection t={t} />
      <CategoriesSection categories={translatedCategories} t={t} />
      <FeaturedProductsSection
        products={initialFeaturedProducts}
        formatPrice={formatPrice}
        t={t}
      />
      <Suspense
        fallback={<div className="py-10 text-center">Loading books...</div>}
      >
        <ErrorBoundary>
          <EducationalBooksSection t={t} />
        </ErrorBoundary>
      </Suspense>
      <Suspense
        fallback={
          <div className="py-10 text-center">Loading value proposition...</div>
        }
      >
        <ErrorBoundary>
          <ValuePropositionSection t={t} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}
