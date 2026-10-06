// [INFO] This file orchestrates the homepage layout. All child sections (Hero, Categories, Value Proposition, Featured Products) have been refactored for perfect responsiveness, accessibility, and a premium, app-like user experience. See individual section files for detailed comments and rationale.
"use client";

import React from "react";

import { AgeCategoriesSection } from "@/features/home/components/AgeCategoriesSection";
import type { HeroPeekProduct } from "@/features/home/components/HeroProductPeek";
import { HeroSection } from "@/features/home/components/HeroSection";
import { PillarSection } from "@/features/home/components/PillarSection";
import { useTranslation } from "@/lib/i18n";

const homePageShellClass =
  "relative min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-950";

const homePageOverlayTopClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(37,99,235,0.07),transparent_30%),radial-gradient(circle_at_90%_22%,rgba(14,165,233,0.05),transparent_28%)]";

const homePageOverlayBottomClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_88%,rgba(37,99,235,0.04),transparent_32%),radial-gradient(circle_at_82%_80%,rgba(15,23,42,0.035),transparent_36%)]";

const homePageContentWrapperClass = "relative z-10 flex flex-col";

export default function HomePageClient({
  children,
  featuredProducts = [],
}: {
  children: React.ReactNode;
  featuredProducts?: HeroPeekProduct[];
}) {
  const { t } = useTranslation();

  return (
    <div className={homePageShellClass}>
      <div className={homePageOverlayTopClass} aria-hidden />
      <div className={homePageOverlayBottomClass} aria-hidden />
      <div className={homePageContentWrapperClass}>
        {/* **PERFORMANCE**: Hero Section - Critical for FCP */}
        <HeroSection t={t} products={featuredProducts} />

        <AgeCategoriesSection t={t} />

        {children}

        {/* Pillar Section - Explorează temele noastre cheie */}
        <PillarSection />
      </div>
    </div>
  );
}
