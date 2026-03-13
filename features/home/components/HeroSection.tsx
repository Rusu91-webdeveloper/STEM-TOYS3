"use client";

import {
  ArrowRight,
  ChevronDown,
  GraduationCap,
  ShieldCheck,
  Layers3,
  Truck,
  Sparkles,
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
const HERO_IMAGE_SRC = "/images/optimized/homepage_hero_banner_01_fallback.jpg";

interface HeroSectionProps {
  t: (key: string, defaultValue?: string) => string;
}

const HeroSectionComponent = ({ t }: HeroSectionProps) => {
  const [enableExperiments, setEnableExperiments] = useState(false);
  const {
    variant: headlineVariant,
    isLoading: headlineVariantLoading,
    track: trackHeadlineAB,
  } = useABTest(HERO_HEADLINE_TEST_NAME, true, enableExperiments);
  const {
    variant: ctaVariant,
    isLoading: ctaVariantLoading,
    track: trackCTAAB,
  } = useABTest(HERO_CTA_TEST_NAME, true, enableExperiments);
  const hasTrackedHeroImpressionRef = useRef(false);

  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const enable = () => setEnableExperiments(true);
    const requestIdleCallbackRef = window.requestIdleCallback?.bind(window);

    if (requestIdleCallbackRef) {
      idleId = requestIdleCallbackRef(enable, { timeout: 3000 });
    } else {
      timeoutId = window.setTimeout(enable, 1500);
    }

    return () => {
      if (typeof idleId === "number" && window.cancelIdleCallback) {
        window.cancelIdleCallback(idleId);
      }

      if (typeof timeoutId === "number") {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const headlineVariantKey = (
    headlineVariant?.name ??
    headlineVariant?.id ??
    "control"
  ).toLowerCase();
  const trustHighlights = [
    { icon: Sparkles, label: "Selectie STEM clara" },
    { icon: GraduationCap, label: "Alegere pe varste" },
    { icon: ShieldCheck, label: "Plata securizata" },
    { icon: Truck, label: "Livrare 1-3 zile" },
  ];
  const ageQuickLinks = [
    {
      label: "3-5 ani",
      hint: "Prima explorare",
      href: "/products?ageGroup=PRESCHOOL_3_5",
    },
    {
      label: "6-8 ani",
      hint: "Invatare activa",
      href: "/products?ageGroup=ELEMENTARY_6_8",
    },
    {
      label: "9-12 ani",
      hint: "Logica si proiecte",
      href: "/products?ageGroup=MIDDLE_SCHOOL_9_12",
    },
    {
      label: "13+ ani",
      hint: "Provocari smart",
      href: "/products?ageGroup=TEENS_13_PLUS",
    },
  ];

  useEffect(() => {
    if (headlineVariantLoading || ctaVariantLoading) return;
    if (hasTrackedHeroImpressionRef.current) return;

    trackHomepageConversionEvent(HOMEPAGE_CONVERSION_EVENTS.HERO_IMPRESSION, {
      headline_variant:
        headlineVariant?.name ?? headlineVariant?.id ?? "control",
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

    return t("homepageH1", "Jucării STEM alese pe vârste");
  };

  const primaryCtaText = "Vezi jucariile STEM";
  const secondaryCtaText = "Alege dupa varsta";

  return (
    <section
      className="relative flex min-h-[58svh] w-full flex-col justify-center overflow-hidden pt-2 sm:min-h-[520px] lg:min-h-[560px]"
      aria-label={t("heroSection", "Homepage Hero Section")}
    >
      <div className="absolute inset-0 z-0 select-none">
        <Image
          src={HERO_IMAGE_SRC}
          alt={t("inspireMinds", "Inspire Curious Minds")}
          fill
          priority
          sizes="100vw"
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
          quality={85}
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
            <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.3em] text-white/92 backdrop-blur-md">
              Selectie STEM pentru Romania
            </span>
          </div>

          <h1 className="mt-4 max-w-6xl text-4xl font-black leading-[0.95] tracking-tight text-white [text-shadow:0_6px_26px_rgba(15,23,42,0.55)] sm:text-6xl lg:text-7xl xl:text-[5.4rem]">
            {t("homepageH1Short", getHeadline())}
          </h1>

          <p className="mt-4 max-w-4xl text-base font-semibold leading-relaxed text-white/95 [text-shadow:0_2px_14px_rgba(15,23,42,0.5)] sm:text-lg lg:text-xl">
            {t(
              "heroDescription",
              "Jucarii educative, robotica si seturi STEM selectate clar pentru acasa, cadouri si invatare aplicata."
            )}
          </p>

          <div className="mt-7 flex w-full max-w-5xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
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
                    cta_variant:
                      ctaVariant?.name ?? ctaVariant?.id ?? "control",
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
              className={`${gradientButtonClass} group relative flex min-h-[4.25rem] w-full items-center justify-between gap-4 overflow-hidden rounded-[1.35rem] px-5 py-3 text-left shadow-[0_24px_42px_-18px_rgba(37,99,235,0.65)] ring-1 ring-white/25 transition-all hover:-translate-y-0.5 hover:shadow-[0_30px_52px_-18px_rgba(14,165,233,0.6)] active:scale-[0.99] sm:min-w-[290px] sm:px-6`}
            >
              <span
                aria-hidden
                className="absolute inset-y-0 -left-10 w-16 skew-x-[-20deg] bg-white/25 blur-sm transition-transform duration-700 group-hover:translate-x-[18rem]"
              />
              <span className="relative z-10 flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  Catalog complet
                </span>
                <span className="mt-0.5 text-base font-black text-white sm:text-[1.05rem]">
                  {primaryCtaText}
                </span>
              </span>
              <span className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/14 ring-1 ring-white/20">
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/jucarii-stem-dupa-varsta"
              onClick={() => {
                void trackHeadlineAB("clicks");
                void trackCTAAB("clicks");
                trackHomepageConversionEvent(
                  HOMEPAGE_CONVERSION_EVENTS.HERO_SECONDARY_CTA_CLICK,
                  {
                    cta_label: secondaryCtaText,
                    headline_variant:
                      headlineVariant?.name ?? headlineVariant?.id ?? "control",
                    cta_variant:
                      ctaVariant?.name ?? ctaVariant?.id ?? "control",
                  }
                );
              }}
              data-conversion="cta"
              data-conversion-type="click"
              data-conversion-category="navigation"
              data-conversion-action="hero_secondary_age_cta_click"
              data-conversion-element="hero_secondary_age_cta"
              data-conversion-metadata={`{"cta":"secondary_age","headlineVariant":"${
                headlineVariant?.name ?? headlineVariant?.id ?? "control"
              }","ctaVariant":"${
                ctaVariant?.name ?? ctaVariant?.id ?? "control"
              }"}`}
              className="group inline-flex min-h-[4.25rem] w-full items-center justify-between gap-4 rounded-[1.35rem] border border-white/55 bg-white/90 px-5 py-3 text-left text-slate-900 shadow-[0_14px_30px_-18px_rgba(15,23,42,0.45)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white sm:min-w-[290px] sm:px-6"
            >
              <span className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Selectie rapida
                </span>
                <span className="mt-0.5 text-base font-black text-slate-950 sm:text-[1.05rem]">
                  {secondaryCtaText}
                </span>
              </span>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition group-hover:border-slate-300 group-hover:bg-white">
                <Layers3 className="h-4 w-4" />
              </span>
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
            {trustHighlights.map(item => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-2 text-xs font-semibold text-white/95 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.75)] backdrop-blur-md"
                >
                  <span
                    aria-hidden
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid w-full max-w-6xl grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {ageQuickLinks.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className="group flex flex-col items-start justify-center rounded-2xl border border-white/22 bg-white/10 px-4 py-3 text-left text-white shadow-[0_12px_20px_-18px_rgba(15,23,42,0.65)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/16"
              >
                <span className="text-sm font-black tracking-tight">
                  {link.label}
                </span>
                <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/70">
                  {link.hint}
                </span>
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
