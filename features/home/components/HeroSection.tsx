"use client";

import {
  Brain,
  ChevronDown,
  CheckCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef } from "react";

import { gradientButtonClass } from "@/features/home/components/homeTheme";
import { useABTest } from "@/hooks/useABTest";
import {
  HOMEPAGE_CONVERSION_EVENTS,
  trackHomepageConversionEvent,
} from "@/lib/analytics/homepage-conversion-events";

const HERO_HEADLINE_TEST_NAME = "homepage_hero_headline";
const HERO_CTA_TEST_NAME = "homepage_hero_cta";

interface HeroSectionProps {
  t: (key: string, defaultValue?: string) => string;
}

const HeroSectionComponent = ({ t }: HeroSectionProps) => {
  const {
    variant: headlineVariant,
    isLoading: headlineVariantLoading,
    track: trackHeadlineAB,
  } = useABTest(
    HERO_HEADLINE_TEST_NAME
  );
  const {
    variant: ctaVariant,
    isLoading: ctaVariantLoading,
    track: trackCTAAB,
  } = useABTest(HERO_CTA_TEST_NAME);
  const hasTrackedHeroImpressionRef = useRef(false);

  const headlineVariantKey =
    (headlineVariant?.name ?? headlineVariant?.id ?? "control").toLowerCase();
  const ctaVariantKey =
    (ctaVariant?.name ?? ctaVariant?.id ?? "control").toLowerCase();

  useEffect(() => {
    if (headlineVariantLoading || ctaVariantLoading) return;
    if (hasTrackedHeroImpressionRef.current) return;

    trackHomepageConversionEvent(HOMEPAGE_CONVERSION_EVENTS.HERO_IMPRESSION, {
      headline_variant: headlineVariant?.name ?? headlineVariant?.id ?? "control",
      cta_variant: ctaVariant?.name ?? ctaVariant?.id ?? "control",
      section: "hero",
    });
    hasTrackedHeroImpressionRef.current = true;
  }, [
    ctaVariant?.id,
    ctaVariant?.name,
    ctaVariantLoading,
    headlineVariant?.id,
    headlineVariant?.name,
    headlineVariantLoading,
  ]);

  const getHeadline = () => {
    if (headlineVariantKey.includes("variant_a")) {
      return "Înlocuiește timpul de ecran cu rezultate reale la școală";
    }

    if (headlineVariantKey.includes("variant_b")) {
      return "Alege jucăria potrivită vârstei și vezi progres rapid";
    }

    return t(
      "homepageH1",
      "Jucării STEM care transformă curiozitatea copilului în progres vizibil"
    );
  };

  const getCTAText = () => {
    if (ctaVariantKey.includes("variant_a")) {
      return "Văd Pachetele";
    }

    if (ctaVariantKey.includes("variant_b")) {
      return "Aleg Ce Mi Se Potrivește";
    }

    return t("ctaShopNow", "Descoperă Pachetele STEM");
  };

  const quickOutcomes: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }> = [
    {
      icon: Brain,
      label: "Concentrare mai bună prin joacă practică",
    },
    {
      icon: Sparkles,
      label: "Creativitate și gândire logică în fiecare sesiune",
    },
    {
      icon: Rocket,
      label: "Pași clari spre tehnologie, știință și inginerie",
    },
  ];

  const ageFastLinks: Array<{ label: string; href: string }> = [
    {
      label: "3-5 ani",
      href: "/products?ageGroup=PRESCHOOL_3_5",
    },
    {
      label: "6-8 ani",
      href: "/products?ageGroup=ELEMENTARY_6_8",
    },
    {
      label: "9-12 ani",
      href: "/products?ageGroup=MIDDLE_SCHOOL_9_12",
    },
    {
      label: "13+ ani",
      href: "/products?ageGroup=TEENS_13_PLUS",
    },
  ];

  return (
    <section
      className="relative flex min-h-[86svh] w-full flex-col justify-center overflow-hidden"
      aria-label={t("heroSection", "Homepage Hero Section")}
    >
      <div className="absolute inset-0 z-0 select-none">
        <Image
          src="/images/optimized/homepage_hero_banner_01_fallback.jpg"
          alt={t("inspireMinds", "Inspire Curious Minds")}
          fill
          priority
          sizes="100vw"
          className="h-full w-full object-cover object-[center_35%] lg:object-center"
          fetchPriority="high"
          quality={85}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-black/30 to-slate-950/90"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 pt-16 sm:px-6 lg:px-8">
        <div className="animate-in slide-in-from-bottom-8 fade-in flex max-w-4xl flex-col items-center text-center duration-1000 fill-mode-forwards sm:items-start sm:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 backdrop-blur-md transition-transform hover:scale-105">
            <div className="flex -space-x-1.5" aria-hidden>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 w-4 rounded-full border border-white/20 bg-gray-400" />
              ))}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/95 shadow-sm">
              10.000+ familii au ales deja STEM
            </span>
          </div>

          <h1 className="mb-4 text-3xl font-black leading-[1.08] tracking-tight text-white drop-shadow-xl sm:text-5xl lg:text-6xl">
            {t("homepageH1Short", getHeadline())}
          </h1>

          <p className="mb-6 max-w-2xl text-base font-medium leading-relaxed text-slate-200 drop-shadow-md sm:text-lg">
            {t(
              "heroDescription",
              "Intri, vezi imediat ce i se potrivește copilului, alegi un pachet complet și comanzi în câteva minute, fără stres."
            )}
          </p>

          <div className="mb-5 grid w-full max-w-3xl gap-2.5 sm:grid-cols-3">
            {quickOutcomes.map((outcome) => {
              const Icon = outcome.icon;
              return (
                <div
                  key={outcome.label}
                  className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 text-left backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-emerald-300" />
                    <p className="text-xs font-medium text-white/90">
                      {outcome.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/products?bundleView=bundles"
              onClick={() => {
                void trackHeadlineAB("clicks");
                void trackCTAAB("clicks");
                trackHomepageConversionEvent(
                  HOMEPAGE_CONVERSION_EVENTS.HERO_PRIMARY_CTA_CLICK,
                  {
                    cta_label: getCTAText(),
                    headline_variant:
                      headlineVariant?.name ?? headlineVariant?.id ?? "control",
                    cta_variant: ctaVariant?.name ?? ctaVariant?.id ?? "control",
                  }
                );
              }}
              data-conversion="cta"
              data-conversion-type="click"
              data-conversion-category="ecommerce"
              data-conversion-action="hero_primary_bundle_cta_click"
              data-conversion-element="hero_primary_bundle_cta"
              data-conversion-metadata={`{"cta":"primary_bundle","headlineVariant":"${
                headlineVariant?.name ?? headlineVariant?.id ?? "control"
              }","ctaVariant":"${
                ctaVariant?.name ?? ctaVariant?.id ?? "control"
              }"}`}
              className={`${gradientButtonClass} group relative flex h-12 w-full items-center justify-center overflow-hidden px-6 text-sm font-bold transition-all active:scale-95 sm:w-auto sm:px-9 sm:text-base`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {getCTAText()}
                <Rocket className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/products"
              onClick={() => {
                void trackHeadlineAB("clicks");
                void trackCTAAB("clicks");
                trackHomepageConversionEvent(
                  HOMEPAGE_CONVERSION_EVENTS.HERO_SECONDARY_CTA_CLICK,
                  {
                    cta_label: "Vezi toate jucăriile",
                    headline_variant:
                      headlineVariant?.name ?? headlineVariant?.id ?? "control",
                    cta_variant: ctaVariant?.name ?? ctaVariant?.id ?? "control",
                  }
                );
              }}
              data-conversion="cta"
              data-conversion-type="click"
              data-conversion-category="navigation"
              data-conversion-action="hero_secondary_products_cta_click"
              data-conversion-element="hero_secondary_products_cta"
              data-conversion-metadata={`{"cta":"secondary_products","headlineVariant":"${
                headlineVariant?.name ?? headlineVariant?.id ?? "control"
              }","ctaVariant":"${
                ctaVariant?.name ?? ctaVariant?.id ?? "control"
              }"}`}
              className="group inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/15 sm:w-auto sm:px-8 sm:text-base"
            >
              Vezi toate jucăriile
            </Link>
          </div>

          <div className="mt-4 flex w-full flex-wrap items-center gap-2">
            {ageFastLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  trackHomepageConversionEvent(
                    HOMEPAGE_CONVERSION_EVENTS.HERO_AGE_CHIP_CLICK,
                    {
                      age_label: link.label,
                      age_group_query: link.href,
                      headline_variant:
                        headlineVariant?.name ?? headlineVariant?.id ?? "control",
                    }
                  );
                }}
                data-conversion="cta"
                data-conversion-type="click"
                data-conversion-category="navigation"
                data-conversion-action="hero_age_chip_click"
                data-conversion-element={`hero_age_chip_${link.label.replace("+", "plus").replace("-", "_")}`}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:border-emerald-300/50 hover:bg-emerald-300/10"
              >
                {link.label}
              </Link>
            ))}
          </div>
          {/*
            Keep this trust line close to CTAs to reduce last-second hesitation.
          */}
          <div className="mt-7 flex flex-wrap items-center gap-2 text-xs font-medium text-white/75">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Retur simplu</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <ShieldCheck className="h-3.5 w-3.5 text-sky-300" />
            <span>Plată securizată</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Livrare rapidă în România</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce opacity-60">
        <ChevronDown className="h-6 w-6 text-white" />
      </div>
    </section>
  );
};

export const HeroSection = React.memo(HeroSectionComponent);
