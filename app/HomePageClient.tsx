// [INFO] This file orchestrates the homepage layout. All child sections (Hero, Categories, Value Proposition, Featured Products) have been refactored for perfect responsiveness, accessibility, and a premium, app-like user experience. See individual section files for detailed comments and rationale.
"use client";

import React, { Suspense } from "react";

// Import home page components
import {
  CategoriesSection,
  FeaturedProductsSection,
  FeaturedProductsSkeleton,
  HeroSection,
  ValuePropositionSection,
} from "@/features/home/components";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import type { Product } from "@/types/product";

// Define categories data
const categories = [
  {
    name: "Science",
    description: "Explore the wonders of science through hands-on experiments",
    slug: "science",
    image: "/images/category_banner_science_01.png",
  },
  {
    name: "Technology",
    description: "Learn coding, robotics, and digital innovation",
    slug: "technology",
    image: "/images/category_banner_technology_01.png",
  },
  {
    name: "Engineering",
    description: "Build, design, and solve problems with engineering kits",
    slug: "engineering",
    image: "/images/category_banner_engineering_01.png",
  },
  {
    name: "Mathematics",
    description: "Make math fun with interactive games and puzzles",
    slug: "mathematics",
    image: "/images/category_banner_math_01.png",
  },
];

// Loading fallback for featured products section
const FeaturedProductsLoader = () => (
  <section className="py-10">
    <div className="container mx-auto px-4 max-w-7xl">
      <div className="mb-8 text-center">
        <span className="inline-block px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full mb-2">
          Recommended For You
        </span>
        <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-center">
          Featured Products
        </h2>
        <p className="text-center text-muted-foreground mb-0 max-w-3xl mx-auto px-2 text-base xs:text-lg sm:text-xl">
          Discover our carefully curated selection of educational toys
        </p>
      </div>
      <FeaturedProductsSkeleton count={4} />
    </div>
  </section>
);

export default function HomePageClient({
  initialFeaturedProducts,
}: {
  initialFeaturedProducts: Product[];
}) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  return (
    <div className="flex flex-col">
      {/* Hero Section with Hero Image - Load immediately */}
      <HeroSection t={t} />

      {/* Categories Section - Load immediately */}
      <CategoriesSection categories={categories} t={t} />

      {/* Value Proposition Section - Load immediately */}
      <ValuePropositionSection t={t} />

      {/* Featured Products Section - Load with suspense for better performance */}
      <Suspense fallback={<FeaturedProductsLoader />}>
        <FeaturedProductsSection
          products={initialFeaturedProducts}
          formatPrice={formatPrice}
          t={t}
          isLoading={initialFeaturedProducts.length === 0}
        />
      </Suspense>
    </div>
  );
}
