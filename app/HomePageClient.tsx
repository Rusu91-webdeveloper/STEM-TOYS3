// [INFO] This file orchestrates the homepage layout. All child sections (Hero, Categories, Value Proposition, Featured Products) have been refactored for perfect responsiveness, accessibility, and a premium, app-like user experience. See individual section files for detailed comments and rationale.
"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

// **PERFORMANCE**: Lazy load non-critical components
import {
  CategoriesSection,
  FeaturedProductsAccordion,
  FeaturedProductsSkeleton,
  PerformanceOptimizer,
  PillarSection,
  TrustBadgesRow,
  AgeQuickLinksRow,
} from "@/features/home/components";

// **PERFORMANCE**: Import HeroSection directly to avoid preload warnings and improve LCP
import { HeroSection } from "@/features/home/components/HeroSection";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { getBaseUrl } from "@/lib/site";

// Code-split below-the-fold sections with better loading strategy
const ValuePropositionSection = dynamic(
  () => import("@/features/home/components/ValuePropositionSection"),
  {
    loading: () => null,
    ssr: false, // Disable SSR for better LCP
  }
);
const RiskReversalSection = dynamic(
  () => import("@/features/home/components/RiskReversalSection"),
  {
    loading: () => null,
    ssr: false, // Disable SSR for better LCP
  }
);
const SupplierBanner = dynamic(
  () =>
    import("@/features/home/components/SupplierBanner").then(
      m => m.SupplierBanner
    ),
  {
    loading: () => null,
    ssr: false, // Disable SSR for better LCP
  }
);
const MobileConversionOptimizer = dynamic(
  () => import("@/features/home/components/MobileConversionOptimizer"),
  {
    loading: () => null,
    ssr: false, // Already disabled
  }
);

// **PERFORMANCE**: HeroSection is now lazy loaded above to reduce bundle size
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

// Loading fallback for featured products accordion
const FeaturedProductsLoader = () => (
  <section className="py-4 sm:py-6 md:py-8 lg:py-10">
    <div className="container mx-auto px-2 sm:px-4 max-w-7xl">
      <div className="mb-3 sm:mb-4 md:mb-6 text-center">
        <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full mb-1 sm:mb-2">
          Recommended For You
        </span>
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 sm:mb-3 md:mb-4 text-center mt-1 sm:mt-0 leading-tight">
          Featured Products
        </h2>
        <p className="text-center text-muted-foreground mb-4 sm:mb-6 md:mb-8 max-w-3xl mx-auto px-4 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed">
          Discover our carefully curated selection of educational toys
        </p>
      </div>

      <div className="relative mx-auto max-w-5xl">
        <div className="overflow-hidden relative rounded-xl shadow-lg border border-gray-200 bg-white">
          <div className="flex flex-col md:flex-row animate-pulse">
            {/* Product image skeleton */}
            <div className="relative h-48 sm:h-56 md:h-80 md:w-1/2 bg-gray-200 rounded-t-xl md:rounded-t-none md:rounded-l-xl"></div>

            {/* Product details skeleton */}
            <div className="p-4 sm:p-6 md:p-8 md:w-1/2 flex flex-col justify-between">
              <div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded-md w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded-md w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-2/3 mb-4"></div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-auto">
                <div className="h-6 sm:h-8 bg-gray-200 rounded-md w-24 mb-2 sm:mb-0"></div>
                <div className="h-10 sm:h-12 bg-gray-200 rounded-md w-full sm:w-32"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicator dots skeleton */}
        <div className="flex justify-center mt-4 sm:mt-6">
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <div
              key={index}
              className="mx-1 h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-gray-200"
            />
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default function HomePageClient({
  initialFeaturedProducts: originalFeaturedProducts,
}: {
  initialFeaturedProducts: Product[];
}) {
  // Force the component to display all 6 products by duplicating some if needed
  const initialFeaturedProducts = [...originalFeaturedProducts];

  // Log the original products for debugging
  console.log(`Original products count: ${originalFeaturedProducts.length}`);
  console.log(
    `Product names: ${originalFeaturedProducts.map(p => p.name).join(", ")}`
  );

  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  // Page-scoped JSON-LD with Local Business Schema for Romania
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
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${baseUrl}#LocalBusiness`,
      name: "TechTots România - Jucării STEM Educaționale",
      description:
        "Magazinul #1 de jucării STEM din România. Transformăm copiii din 'urăsc matematica' în 'când facem experimente?' în doar 30 de zile. Peste 10,000 de părinți mulțumiți.",
      url: baseUrl,
      telephone: "+40771248029",
      email: "webira.rem.srl@gmail.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Str. Mehedinți 54-56",
        addressLocality: "Cluj-Napoca",
        postalCode: "400000",
        addressRegion: "Cluj",
        addressCountry: "RO",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: "46.7712",
        longitude: "23.6236",
      },
      areaServed: [
        {
          "@type": "Country",
          name: "România",
        },
        {
          "@type": "AdministrativeArea",
          name: "București",
        },
        {
          "@type": "AdministrativeArea",
          name: "Cluj-Napoca",
        },
        {
          "@type": "AdministrativeArea",
          name: "Timișoara",
        },
        {
          "@type": "AdministrativeArea",
          name: "Iași",
        },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Jucării STEM România - Catalog Educațional",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Product",
              name: "Jucării Științifice pentru copii 3-12 ani",
              category: "Jucării STEM Știință",
              description:
                "Experimente și kituri științifice care transformă învățarea în aventură",
            },
            areaServed: "România",
            availableDeliveryMethod: "https://schema.org/OnSitePickup",
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Product",
              name: "Jucării Tehnologie și Robotică",
              category: "Jucării STEM Tehnologie",
              description:
                "Roboți educaționali și kituri de programare pentru copii",
            },
            areaServed: "România",
            availableDeliveryMethod: "https://schema.org/OnSitePickup",
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Product",
              name: "Jucării Inginerie și Construcții",
              category: "Jucării STEM Inginerie",
              description:
                "Kituri de construcție și inginerie pentru dezvoltarea creativității",
            },
            areaServed: "România",
            availableDeliveryMethod: "https://schema.org/OnSitePickup",
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Product",
              name: "Jocuri Matematică Interactivă",
              category: "Jucării STEM Matematică",
              description:
                "Jocuri matematice care fac calculele distractive și ușoare",
            },
            areaServed: "România",
            availableDeliveryMethod: "https://schema.org/OnSitePickup",
          },
        ],
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "18:00",
      },
      paymentAccepted: ["Cash", "Credit Card", "PayPal", "Bank Transfer"],
      currenciesAccepted: "RON",
      priceRange: "€€",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "2847",
        bestRating: "5",
        worstRating: "1",
      },
    },
  ];

  return (
    <div className="flex flex-col">
      <SeoJsonLd data={jsonLd} />
      {/* Performance Optimizer - Loads first for optimal Core Web Vitals */}
      <PerformanceOptimizer />

      {/* **PERFORMANCE**: Hero Section - Critical for FCP */}
      <HeroSection t={t} />

      {/* **PERFORMANCE**: Trust badges and age links - Keep above fold for UX but optimize loading */}
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

      {/* **PERFORMANCE**: Defer non-critical sections below the fold */}
      <Suspense
        fallback={
          <div className="h-32 bg-gray-100 animate-pulse rounded-lg mx-4 max-w-7xl"></div>
        }
      >
        <PillarSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-48 bg-gray-100 animate-pulse rounded-lg mx-4 max-w-7xl"></div>
        }
      >
        <CategoriesSection categories={categories} t={t} />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-64 bg-gray-100 animate-pulse rounded-lg mx-4 max-w-7xl"></div>
        }
      >
        <ValuePropositionSection t={t} />
      </Suspense>

      {/* Risk Reversal Section - Guarantees and Consultation */}
      <RiskReversalSection t={t} />

      {/* Featured Products Accordion - Load with suspense for better performance */}
      <Suspense fallback={<FeaturedProductsLoader />}>
        <FeaturedProductsAccordion
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
