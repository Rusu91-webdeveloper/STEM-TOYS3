// [INFO] This file orchestrates the homepage layout. All child sections (Hero, Categories, Value Proposition, Featured Products) have been refactored for perfect responsiveness, accessibility, and a premium, app-like user experience. See individual section files for detailed comments and rationale.
"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

// Import home page components
import {
  CategoriesSection,
  FeaturedProductsSection,
  FeaturedProductsSkeleton,
  HeroSection,
  PerformanceOptimizer,
  PillarSection,
  TrustBadgesRow,
  AgeQuickLinksRow,
} from "@/features/home/components";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { getBaseUrl } from "@/lib/site";

// Code-split below-the-fold sections
const ValuePropositionSection = dynamic(
  () => import("@/features/home/components/ValuePropositionSection"),
  { loading: () => null }
);
const RiskReversalSection = dynamic(
  () => import("@/features/home/components/RiskReversalSection"),
  { loading: () => null }
);
const SupplierBanner = dynamic(
  () =>
    import("@/features/home/components/SupplierBanner").then(
      m => m.SupplierBanner
    ),
  { loading: () => null }
);
const MobileConversionOptimizer = dynamic(
  () => import("@/features/home/components/MobileConversionOptimizer"),
  { ssr: false, loading: () => null }
);
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
      <FeaturedProductsSkeleton count={3} />
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

  // Page-scoped JSON-LD
  const baseUrl = getBaseUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "TechTots",
      url: baseUrl,
      logo: `${baseUrl}/icon.png`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "TechTots STEM Toys",
      url: baseUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/products?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <div className="flex flex-col">
      <SeoJsonLd data={jsonLd} />
      {/* Performance Optimizer - Loads first for optimal Core Web Vitals */}
      <PerformanceOptimizer />

      {/* Hero Section with Hero Image - Load immediately */}
      <HeroSection t={t} />

      {/* Combined Quick Access Bar with trust badges and age links */}
      <div className="-mt-4 sm:-mt-6 mb-4 sm:mb-6">
        <div className="container mx-auto px-4">
          <div className="mx-auto w-full max-w-5xl bg-white/95 backdrop-blur shadow-sm border border-gray-100 rounded-2xl p-4 sm:p-6">
            {/* Trust badges row */}
            <TrustBadgesRow t={t} />

            {/* Subtle divider */}
            <div className="my-3 sm:my-4 border-t border-gray-100"></div>

            {/* Age quick links row */}
            <AgeQuickLinksRow t={t} />
          </div>
        </div>
      </div>

      {/* Pillar Section - Key content themes */}
      <PillarSection />

      {/* Categories Section - Load immediately */}
      <CategoriesSection categories={categories} t={t} />

      {/* Value Proposition Section - Load immediately */}
      <ValuePropositionSection t={t} />

      {/* Risk Reversal Section - Guarantees and Consultation */}
      <RiskReversalSection t={t} />

      {/* Featured Products Section - Load with suspense for better performance */}
      <Suspense fallback={<FeaturedProductsLoader />}>
        <FeaturedProductsSection
          products={initialFeaturedProducts}
          formatPrice={formatPrice}
          t={t}
          isLoading={initialFeaturedProducts.length === 0}
        />
      </Suspense>

      {/* Supplier Banner - Only visible on Home page */}
      <SupplierBanner t={t} />

      {/* Mobile Conversion Optimizer - Sticky CTAs, trust indicators, etc. */}
      <MobileConversionOptimizer t={t} />
    </div>
  );
}
