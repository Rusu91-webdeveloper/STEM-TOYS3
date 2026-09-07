// [INFO] This file orchestrates the homepage layout. All child sections (Hero, Categories, Value Proposition, Featured Products) have been refactored for perfect responsiveness, accessibility, and a premium, app-like user experience. See individual section files for detailed comments and rationale.
"use client";

import React from "react";

import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { AgeCategoriesSection } from "@/features/home/components/AgeCategoriesSection";
import { HeroSection } from "@/features/home/components/HeroSection";
import { PillarSection } from "@/features/home/components/PillarSection";
import { publicConfig } from "@/lib/config/app-config";
import { useTranslation } from "@/lib/i18n";
import { getBaseUrl } from "@/lib/site";

const homePageShellClass =
  "relative min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-950";

const homePageOverlayTopClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(37,99,235,0.07),transparent_30%),radial-gradient(circle_at_90%_22%,rgba(14,165,233,0.05),transparent_28%)]";

const homePageOverlayBottomClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_88%,rgba(37,99,235,0.04),transparent_32%),radial-gradient(circle_at_82%_80%,rgba(15,23,42,0.035),transparent_36%)]";

const homePageContentWrapperClass = "relative z-10 flex flex-col";

export default function HomePageClient({
  children,
}: {
  children: React.ReactNode;
}) {
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

        {children}

        {/* Pillar Section - Explorează temele noastre cheie */}
        <PillarSection />
      </div>
    </div>
  );
}
