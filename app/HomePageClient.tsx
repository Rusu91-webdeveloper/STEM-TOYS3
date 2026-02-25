// [INFO] This file orchestrates the homepage layout. All child sections (Hero, Categories, Value Proposition, Featured Products) have been refactored for perfect responsiveness, accessibility, and a premium, app-like user experience. See individual section files for detailed comments and rationale.
"use client";

import dynamic from "next/dynamic";
import React, { Suspense } from "react";

import { publicConfig } from "@/lib/config/app-config";

import SeoJsonLd from "@/components/seo/SeoJsonLd";
import {
  BundlesShowcaseSection,
  CategoriesSection,
  FeaturedProductsGrid,
  PerformanceOptimizer,
  PillarSection,
} from "@/features/home/components";
import { HeroSection } from "@/features/home/components/HeroSection";
import type { HomeBundle } from "@/features/home/types";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import { getBaseUrl } from "@/lib/site";
import type { Product } from "@/types/product";

// Code-split below-the-fold sections with better loading strategy
const ValuePropositionSection = dynamic(
  () => import("@/features/home/components/ValuePropositionSection"),
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

// Define categories data
const categories = [
  {
    name: "Coding & Robotics",
    description: "Coding games, robots, and programmable toys",
    slug: "coding-robotics",
    image: "/coding-robotic.png",
    productFilterCategory: "technology",
  },
  {
    name: "Science Kits",
    description: "Experiments and science sets that spark curiosity",
    slug: "science-experiments",
    image: "/Science.png",
    productFilterCategory: "science",
  },
  {
    name: "Engineering",
    description: "Build-and-create toys for future inventors",
    slug: "magnetic-building",
    image: "/Engineering.png",
    productFilterCategory: "engineering",
  },
  {
    name: "Technology",
    description: "Tech-focused toys and smart learning tools",
    slug: "technology",
    image: "/Technology.png",
    productFilterCategory: "technology",
  },
  {
    name: "Mathematics",
    description: "Math games and logic activities for fun learning",
    slug: "mathematics",
    image: "/Mathematic.png",
    productFilterCategory: "mathematics",
  },
];

const homePageShellClass =
  "relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f1f8ff_0%,#ffffff_48%,#eef6ff_100%)] text-slate-900";

const homePageOverlayTopClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(56,189,248,0.18),transparent_42%),radial-gradient(circle_at_85%_12%,rgba(250,204,21,0.14),transparent_38%)]";

const homePageOverlayBottomClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_85%,rgba(34,197,94,0.12),transparent_42%),radial-gradient(circle_at_80%_82%,rgba(99,102,241,0.12),transparent_44%)]";

const homePageContentWrapperClass =
  "relative z-10 flex flex-col gap-4 sm:gap-6 lg:gap-10";

// Loading fallback for featured products accordion
const FeaturedProductsLoader = () => (
  <section className="py-6 sm:py-8 md:py-12 lg:py-14">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="mb-4 sm:mb-6 md:mb-8 text-center">
        <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full mb-2">
          Recommended For You
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2.5 sm:mb-3.5 md:mb-4 text-center mt-1 sm:mt-0 leading-tight tracking-tight">
          Featured Products
        </h2>
        <p className="text-center text-muted-foreground mb-5 sm:mb-7 md:mb-9 max-w-3xl mx-auto px-4 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed">
          Discover our carefully curated selection of educational toys
        </p>
      </div>

      <div className="relative mx-auto max-w-5xl">
        <div className="overflow-hidden relative rounded-2xl shadow-sm border border-border bg-card">
          <div className="flex flex-col md:flex-row animate-pulse">
            {/* Product image skeleton */}
            <div className="relative h-48 sm:h-56 md:h-80 md:w-1/2 bg-muted rounded-t-2xl md:rounded-t-none md:rounded-l-2xl"></div>

            {/* Product details skeleton */}
            <div className="p-4 sm:p-6 md:p-8 md:w-1/2 flex flex-col justify-between">
              <div>
                <div className="h-6 sm:h-8 bg-muted rounded-md w-3/4 mb-3"></div>
                <div className="h-3.5 bg-muted rounded-md w-full mb-2"></div>
                <div className="h-3.5 bg-muted rounded-md w-11/12 mb-2"></div>
                <div className="h-3.5 bg-muted rounded-md w-2/3 mb-4"></div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-auto">
                <div className="h-6 sm:h-8 bg-muted rounded-md w-24 mb-2 sm:mb-0"></div>
                <div className="h-10 sm:h-12 bg-muted rounded-md w-full sm:w-32"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicator dots skeleton */}
        <div className="flex justify-center mt-4 sm:mt-6">
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <div
              key={index}
              className="mx-1 h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-muted"
            />
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default function HomePageClient({
  initialFeaturedProducts: originalFeaturedProducts,
  initialBundles,
}: {
  initialFeaturedProducts: Product[];
  initialBundles: HomeBundle[];
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
      telephone: publicConfig.storePhone,
      email: publicConfig.contactEmail,
      address: {
        "@type": "PostalAddress",
        streetAddress: process.env.NEXT_PUBLIC_STORE_STREET_ADDRESS || "Str. Mehedinți 54-56",
        addressLocality: process.env.NEXT_PUBLIC_STORE_CITY || "Cluj-Napoca",
        postalCode: process.env.NEXT_PUBLIC_STORE_POSTAL_CODE || "400000",
        addressRegion: process.env.NEXT_PUBLIC_STORE_STATE || "Cluj",
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
    <div className={homePageShellClass}>
      <SeoJsonLd data={jsonLd} />
      <div className={homePageOverlayTopClass} aria-hidden />
      <div className={homePageOverlayBottomClass} aria-hidden />
      <div className={homePageContentWrapperClass}>
        {/* Performance Optimizer - Loads first for optimal Core Web Vitals */}
        <PerformanceOptimizer />

        {/* **PERFORMANCE**: Hero Section - Critical for FCP */}
        <HeroSection t={t} />

        {/* Shop by Category - first shopping section under hero */}
        <Suspense
          fallback={
            <div className="mx-4 max-w-7xl animate-pulse rounded-2xl bg-white/70 shadow-sm sm:mx-6 lg:mx-8"></div>
          }
        >
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <CategoriesSection categories={categories} t={t} />
          </div>
        </Suspense>

        {/* Featured Products - second section (as in screenshot) */}
        <Suspense fallback={<FeaturedProductsLoader />}>
          <FeaturedProductsGrid
            products={initialFeaturedProducts}
            t={t}
            isLoading={initialFeaturedProducts.length === 0}
          />
        </Suspense>

        {/* Bundle promo strip + Bundles - directly under featured products */}
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-4 py-5 text-white shadow-[0_18px_50px_-20px_rgba(37,99,235,0.55)] sm:px-6 sm:py-6">
              <div className="pointer-events-none absolute -left-10 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-white/15 blur-2xl" />
              <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-300/25 blur-2xl" />
              <div className="relative flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-100">
                    Bundle Deal
                  </p>
                  <h2 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">
                    Save 10% on STEM Bundles
                  </h2>
                  <p className="mt-1 text-sm text-blue-100/95 sm:text-base">
                    Build a real toy-store experience with ready-made bundles instead of shopping items one by one.
                  </p>
                </div>
                <a
                  href="/products?bundleView=bundles"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/30 bg-white/15 px-5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Shop Bundles
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Bundles Showcase - High-conversion section for package deals */}
        <BundlesShowcaseSection
          bundles={initialBundles}
          formatPrice={formatPrice}
        />

        {/* Supporting content below the main storefront sections */}
        <Suspense
          fallback={
            <div className="mx-4 max-w-7xl animate-pulse rounded-2xl bg-white/70 shadow-sm sm:mx-6 lg:mx-8"></div>
          }
        >
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ValuePropositionSection t={t} />
          </div>
        </Suspense>

        {/* **PERFORMANCE**: Defer non-critical sections below the fold */}
        <Suspense
          fallback={
            <div className="mx-4 max-w-7xl animate-pulse rounded-2xl bg-white/70 shadow-sm sm:mx-6 lg:mx-8"></div>
          }
        >
          <PillarSection />
        </Suspense>

        {/* Supplier Banner - Only visible on Home page */}
        <SupplierBanner t={t} />

        {/* Mobile Conversion Optimizer - Sticky CTAs, trust indicators, etc. */}
        <MobileConversionOptimizer t={t} />
      </div>
    </div>
  );
}
