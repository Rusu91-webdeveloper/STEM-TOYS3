"use client";

import React from "react";


// Import home page components
import { CategoriesSection } from "@/features/home/components/CategoriesSection";
import { FeaturedProductsSection } from "@/features/home/components/FeaturedProductsSection";
import { HeroSection } from "@/features/home/components/HeroSection";
import ValuePropositionSection from "@/features/home/components/ValuePropositionSection";
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

export default function HomePageClient({
  initialFeaturedProducts,
}: {
  initialFeaturedProducts: Product[];
}) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  return (
    <div className="flex flex-col">
      {/* Hero Section with Hero Image */}
      <HeroSection t={t} />

      {/* Categories Section */}
      <CategoriesSection categories={categories} t={t} />

      {/* Value Proposition Section */}
      <ValuePropositionSection t={t} />

      {/* Featured Products Section - Now after Value Proposition */}
      <FeaturedProductsSection
        products={initialFeaturedProducts}
        formatPrice={formatPrice}
        t={t}
      />
    </div>
  );
}
