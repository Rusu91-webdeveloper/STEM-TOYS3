// [INFO] This file orchestrates the homepage layout. All child sections (Hero, Categories, Value Proposition, Featured Products) have been refactored for perfect responsiveness, accessibility, and a premium, app-like user experience. See individual section files for detailed comments and rationale.
"use client";

import dynamic from "next/dynamic";
import React, { Suspense } from "react";

import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { AgeCategoriesSection } from "@/features/home/components/AgeCategoriesSection";
import { FeaturedProductsGrid } from "@/features/home/components/FeaturedProductsGrid";
import { HeroSection } from "@/features/home/components/HeroSection";
import { PillarSection } from "@/features/home/components/PillarSection";
import type { HomeBundle } from "@/features/home/types";
import { publicConfig } from "@/lib/config/app-config";
import { useTranslation } from "@/lib/i18n";
import { getBaseUrl } from "@/lib/site";
import type { Product } from "@/types/product";

// Code-split below-the-fold sections with better loading strategy
const MobileConversionOptimizer = dynamic(
  () => import("@/features/home/components/MobileConversionOptimizer"),
  {
    loading: () => null,
    ssr: false, // Already disabled
  }
);

const homePageShellClass =
  "relative min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-950";

const homePageOverlayTopClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(37,99,235,0.07),transparent_30%),radial-gradient(circle_at_90%_22%,rgba(14,165,233,0.05),transparent_28%)]";

const homePageOverlayBottomClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_88%,rgba(37,99,235,0.04),transparent_32%),radial-gradient(circle_at_82%_80%,rgba(15,23,42,0.035),transparent_36%)]";

const homePageContentWrapperClass = "relative z-10 flex flex-col";

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
  initialBundles: _initialBundles,
}: {
  initialFeaturedProducts: Product[];
  initialBundles: HomeBundle[];
}) {
  // Force the component to display all 6 products by duplicating some if needed
  const initialFeaturedProducts = [...originalFeaturedProducts];

  const { t } = useTranslation();

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
            name: "Robotica pentru copii",
            url: `${baseUrl}/robotica-pentru-copii`,
            category: "Tehnologie",
            description:
              "Roboti educativi, coding si kituri interactive pentru copii curiosi.",
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

        <AgeCategoriesSection t={t} />

        {/* Featured Products - second section (as in screenshot) */}
        <Suspense fallback={<FeaturedProductsLoader />}>
          <FeaturedProductsGrid
            products={initialFeaturedProducts}
            t={t}
            isLoading={initialFeaturedProducts.length === 0}
          />
        </Suspense>

        {/* Pillar Section - Explorează temele noastre cheie */}
        <PillarSection />

        {/* Mobile Conversion Optimizer - Sticky CTAs, trust indicators, etc. */}
        <MobileConversionOptimizer t={t} />
      </div>
    </div>
  );
}
