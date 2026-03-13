// [INFO] This file orchestrates the homepage layout. All child sections (Hero, Categories, Value Proposition, Featured Products) have been refactored for perfect responsiveness, accessibility, and a premium, app-like user experience. See individual section files for detailed comments and rationale.
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import React, { Suspense } from "react";

import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { BundlesShowcaseSection } from "@/features/home/components/BundlesShowcaseSection";
import { CategoriesSection } from "@/features/home/components/CategoriesSection";
import { FeaturedProductsGrid } from "@/features/home/components/FeaturedProductsGrid";
import { HeroSection } from "@/features/home/components/HeroSection";
import PillarSection from "@/features/home/components/PillarSection";
import { SearchJourneysSection } from "@/features/home/components/SearchJourneysSection";
import type { HomeBundle } from "@/features/home/types";
import { publicConfig } from "@/lib/config/app-config";
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
    name: "Coding si robotica",
    description: "Roboti, coding si kituri programabile pentru joaca aplicata",
    slug: "coding-robotics",
    image: "/images/home/category-coding-kits.svg",
    productFilterCategory: "technology",
  },
  {
    name: "Stiinta si experimente",
    description: "Experimente practice si seturi care deschid curiozitatea",
    slug: "science-experiments",
    image: "/images/home/category-science-kits.svg",
    productFilterCategory: "science",
  },
  {
    name: "Constructie si inginerie",
    description: "Jucarii de construit pentru spatialitate si proiecte creative",
    slug: "magnetic-building",
    image: "/images/home/category-engineering.svg",
    productFilterCategory: "engineering",
  },
  {
    name: "Tehnologie",
    description: "Instrumente smart si jucarii tech pentru copii curiosi",
    slug: "technology",
    image: "/images/home/category-robotics.svg",
    productFilterCategory: "technology",
  },
  {
    name: "Matematica si logica",
    description: "Jocuri de logica si activitati care fac matematica mai clara",
    slug: "mathematics",
    image: "/Mathematic.png",
    productFilterCategory: "mathematics",
  },
];

const homePageShellClass =
  "relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f6fbff_0%,#ffffff_45%,#f1f8ff_100%)] text-slate-900";

const homePageOverlayTopClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(56,189,248,0.12),transparent_38%),radial-gradient(circle_at_86%_14%,rgba(16,185,129,0.08),transparent_30%)]";

const homePageOverlayBottomClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_85%,rgba(34,197,94,0.08),transparent_36%),radial-gradient(circle_at_80%_82%,rgba(99,102,241,0.08),transparent_40%)]";

const homePageContentWrapperClass =
  "relative z-10 flex flex-col gap-5 sm:gap-7 lg:gap-12";

// Loading fallback for featured products accordion
const FeaturedProductsLoader = () => (
  <section className="py-6 sm:py-8 md:py-12 lg:py-14">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="mb-4 sm:mb-6 md:mb-8 text-center">
        <span className="inline-block rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-0.5 text-xs font-medium text-emerald-700 sm:px-3 sm:py-1 mb-2">
          Selectie recomandata
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2.5 sm:mb-3.5 md:mb-4 text-center mt-1 sm:mt-0 leading-tight tracking-tight">
          Produse recomandate
        </h2>
        <p className="text-center text-muted-foreground mb-5 sm:mb-7 md:mb-9 max-w-3xl mx-auto px-4 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed">
          Descopera o selectie clara de jucarii educative si STEM
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
      "@type": "OnlineStore",
      "@id": `${baseUrl}#OnlineStore`,
      name: "TechTots",
      description:
        "Magazin online din Romania cu jucarii STEM, jucarii educative, kituri de robotica, jocuri de logica si experimente stiintifice pentru copii.",
      url: baseUrl,
      telephone: publicConfig.storePhone,
      email: publicConfig.contactEmail,
      address: {
        "@type": "PostalAddress",
        streetAddress:
          process.env.NEXT_PUBLIC_STORE_STREET_ADDRESS ||
          "Str. Mehedinți 54-56",
        addressLocality: process.env.NEXT_PUBLIC_STORE_CITY || "Cluj-Napoca",
        postalCode: process.env.NEXT_PUBLIC_STORE_POSTAL_CODE || "400000",
        addressRegion: process.env.NEXT_PUBLIC_STORE_STATE || "Cluj",
        addressCountry: "RO",
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
        name: "Catalog jucarii STEM si educative",
        itemListElement: [
          {
            "@type": "OfferCatalog",
            name: "Experimente stiintifice pentru copii",
            url: `${baseUrl}/categories/science-experiments`,
            category: "Stiinta",
            description:
              "Experimente si kituri stiintifice pentru joaca practica si invatare aplicata.",
          },
          {
            "@type": "OfferCatalog",
            name: "Robotica pentru copii",
            url: `${baseUrl}/robotica-pentru-copii`,
            category: "Tehnologie",
            description:
              "Roboti educativi, coding si kituri interactive pentru copii curiosi.",
          },
          {
            "@type": "OfferCatalog",
            name: "Constructii si inginerie",
            url: `${baseUrl}/categories/magnetic-building`,
            category: "Inginerie",
            description:
              "Seturi de constructie pentru spatialitate, logica si proiecte creative.",
          },
          {
            "@type": "OfferCatalog",
            name: "Jucarii inteligente si logica",
            url: `${baseUrl}/jucarii-inteligente`,
            category: "Logica",
            description:
              "Jocuri de logica, provocari smart si activitati pentru gandire structurata.",
          },
        ],
      },
      currenciesAccepted: "RON",
    },
  ];

  return (
    <div className={homePageShellClass}>
      <SeoJsonLd data={jsonLd} />
      <div className={homePageOverlayTopClass} aria-hidden />
      <div className={homePageOverlayBottomClass} aria-hidden />
      <div className={homePageContentWrapperClass}>
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
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94)_0%,rgba(240,249,255,0.98)_56%,rgba(236,253,245,0.95)_100%)] px-5 py-5 text-slate-900 shadow-[0_26px_60px_-42px_rgba(15,23,42,0.22)] sm:px-7 sm:py-6">
              <div className="pointer-events-none absolute -left-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-sky-200/40 blur-3xl" />
              <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-200/35 blur-3xl" />
              <div className="relative flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-sky-700">
                    Pachete STEM
                  </p>
                  <h2 className="mt-1 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                    Economisesti 10% cand alegi un bundle gata construit
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-slate-600 sm:text-base">
                    Pachetele combina produse care functioneaza bine impreuna si
                    reduc timpul de selectie.
                  </p>
                </div>
                <Link
                  href="/products?bundleView=bundles"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.25)] transition hover:border-slate-300 hover:text-slate-950"
                >
                  Vezi pachetele
                </Link>
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

        <SearchJourneysSection />

        {/* Supplier Banner - Only visible on Home page */}
        <SupplierBanner t={t} />

        {/* Mobile Conversion Optimizer - Sticky CTAs, trust indicators, etc. */}
        <MobileConversionOptimizer t={t} />
      </div>
    </div>
  );
}
