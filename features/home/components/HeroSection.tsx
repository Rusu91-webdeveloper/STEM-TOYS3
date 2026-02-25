"use client";

import {
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

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
  const [heroImageSrc, setHeroImageSrc] = useState("/HeroImage.png");

  const headlineVariantKey =
    (headlineVariant?.name ?? headlineVariant?.id ?? "control").toLowerCase();
  const trustHighlights = [
    { icon: "⭐", label: "4.9/5 Rating" },
    { icon: "🎯", label: "By Age" },
    { icon: "📦", label: "Bundle Savings" },
    { icon: "🔒", label: "Secure Pay" },
    { icon: "🚚", label: "1-3 Day Delivery" },
  ];
  const ageQuickLinks = [
    { icon: "🐣", label: "3-5", href: "/products?ageGroup=PRESCHOOL_3_5" },
    { icon: "🎒", label: "6-8", href: "/products?ageGroup=ELEMENTARY_6_8" },
    {
      icon: "🧠",
      label: "9-12",
      href: "/products?ageGroup=MIDDLE_SCHOOL_9_12",
    },
    { icon: "🚀", label: "13+", href: "/products?ageGroup=TEENS_13_PLUS" },
  ];

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
      return "Mai puțin ecran. Mai multă învățare.";
    }

    if (headlineVariantKey.includes("variant_b")) {
      return "Alege rapid după vârstă.";
    }

    return t(
      "homepageH1",
      "Jucării STEM alese pe vârste"
    );
  };

  const primaryCtaText = "Shop Now";
  const secondaryCtaText = "Learn More";

  return (
    <section
      className="relative flex min-h-[58svh] w-full flex-col justify-center overflow-hidden pt-2 sm:min-h-[520px] lg:min-h-[560px]"
      aria-label={t("heroSection", "Homepage Hero Section")}
    >
      <div className="absolute inset-0 z-0 select-none">
        <Image
          src={heroImageSrc}
          alt={t("inspireMinds", "Inspire Curious Minds")}
          fill
          priority
          sizes="100vw"
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
          quality={90}
          onError={() => {
            if (heroImageSrc !== "/HeroImageTechTechtots.png") {
              setHeroImageSrc("/HeroImageTechTechtots.png");
            }
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-900/45 via-blue-700/32 to-sky-500/15"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.2),transparent_38%),radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_25%_85%,rgba(253,224,71,0.14),transparent_32%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.12),rgba(2,6,23,0.3))]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(2,6,23,0.62)_0%,rgba(2,6,23,0.38)_35%,rgba(2,6,23,0.15)_65%,rgba(2,6,23,0.06)_100%)]"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="animate-in slide-in-from-bottom-8 fade-in flex w-full flex-col text-left duration-1000 fill-mode-forwards">
          <div className="max-w-5xl">
            <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-white/90 backdrop-blur-md">
              STEM Toys • TechTots
            </span>
          </div>

          <h1 className="mt-4 max-w-6xl text-4xl font-black leading-[0.95] tracking-tight text-white [text-shadow:0_6px_26px_rgba(15,23,42,0.55)] sm:text-6xl lg:text-7xl xl:text-[5.4rem]">
            {t("homepageH1Short", getHeadline())}
          </h1>

          <p className="mt-4 max-w-4xl text-base font-semibold leading-relaxed text-white/95 [text-shadow:0_2px_14px_rgba(15,23,42,0.5)] sm:text-lg lg:text-xl">
            {t(
              "heroDescription",
              "Pachete STEM clare, livrare rapidă, comandă simplă."
            )}
          </p>

          <div className="mt-7 flex w-full max-w-4xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/products"
              onClick={() => {
                void trackHeadlineAB("clicks");
                void trackCTAAB("clicks");
                trackHomepageConversionEvent(
                  HOMEPAGE_CONVERSION_EVENTS.HERO_PRIMARY_CTA_CLICK,
                  {
                    cta_label: primaryCtaText,
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
              className={`${gradientButtonClass} group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl px-7 text-base font-black shadow-[0_22px_38px_-18px_rgba(37,99,235,0.7)] ring-1 ring-white/25 transition-all hover:-translate-y-0.5 hover:shadow-[0_28px_46px_-18px_rgba(14,165,233,0.65)] active:scale-[0.99] sm:w-auto sm:min-w-[250px] sm:px-10`}
            >
              <span
                aria-hidden
                className="absolute inset-y-0 -left-10 w-16 skew-x-[-20deg] bg-white/25 blur-sm transition-transform duration-700 group-hover:translate-x-[18rem]"
              />
              <span className="relative z-10 flex items-center gap-2">
                {primaryCtaText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/blog"
              onClick={() => {
                void trackHeadlineAB("clicks");
                void trackCTAAB("clicks");
                trackHomepageConversionEvent(
                  HOMEPAGE_CONVERSION_EVENTS.HERO_SECONDARY_CTA_CLICK,
                  {
                    cta_label: secondaryCtaText,
                    headline_variant:
                      headlineVariant?.name ?? headlineVariant?.id ?? "control",
                    cta_variant: ctaVariant?.name ?? ctaVariant?.id ?? "control",
                  }
                );
              }}
              data-conversion="cta"
              data-conversion-type="click"
              data-conversion-category="navigation"
              data-conversion-action="hero_secondary_blog_cta_click"
              data-conversion-element="hero_secondary_blog_cta"
              data-conversion-metadata={`{"cta":"secondary_blog","headlineVariant":"${
                headlineVariant?.name ?? headlineVariant?.id ?? "control"
              }","ctaVariant":"${
                ctaVariant?.name ?? ctaVariant?.id ?? "control"
              }"}`}
              className="group inline-flex h-14 w-full items-center justify-center rounded-2xl border border-white/55 bg-white/90 px-7 text-base font-bold text-slate-900 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.45)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white sm:w-auto sm:min-w-[220px] sm:px-10"
            >
              {secondaryCtaText}
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-white/90">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.2)]" />
              Livrare 1-3 zile
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_0_4px_rgba(34,211,238,0.18)]" />
              Plată securizată
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_0_4px_rgba(129,140,248,0.18)]" />
              Recomandări pe vârstă
            </span>
          </div>

          <div className="mt-5 flex w-full max-w-6xl flex-wrap items-center gap-2.5">
            {trustHighlights.map(item => (
              <div
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-2 text-xs font-semibold text-white/95 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.75)] backdrop-blur-md"
              >
                <span
                  aria-hidden
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm"
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 grid w-full max-w-6xl grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {ageQuickLinks.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-white/22 bg-white/10 px-3 py-3 text-sm font-semibold text-white shadow-[0_12px_20px_-18px_rgba(15,23,42,0.65)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/16"
              >
                <span aria-hidden className="text-base">
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce opacity-70">
        <ChevronDown className="h-6 w-6 text-white/90" />
      </div>
    </section>
  );
};

export const HeroSection = React.memo(HeroSectionComponent);
