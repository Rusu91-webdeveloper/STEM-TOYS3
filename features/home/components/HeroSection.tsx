"use client";

import {
  ArrowRight,
  ChevronDown,
  GraduationCap,
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
const HERO_IMAGE_SRC = "/hero10.png";

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
    { icon: Sparkles, label: t("heroTrust1", "Branduri premium europene") },
    { icon: Truck, label: t("heroTrust2", "Livrare 1–3 zile în România") },
    {
      icon: GraduationCap,
      label: t("heroTrust3", "Selecție curată pe vârste"),
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
    return t("homepageH1Short", "Inspirație. Creație. Viitor.");
  };

  const primaryCtaText = t("heroPrimaryCta", "EXPLOREAZĂ COLECȚIA");
  const secondaryCtaText = t("heroSecondaryCta", "Vezi Categorii");

  return (
    <section
      className="relative flex min-h-[52svh] w-full flex-col justify-center overflow-hidden pt-1 sm:min-h-[520px] lg:min-h-[560px]"
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

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="animate-in slide-in-from-bottom-8 fade-in flex w-full flex-col text-left duration-1000 fill-mode-forwards">
          <div className="max-w-4xl">
            <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.26em] text-white/92 backdrop-blur-md sm:px-4 sm:py-1.5 sm:text-[0.68rem] sm:tracking-[0.3em]">
              {t("heroKicker", "VIITORUL EDUCAȚIEI")}
            </span>
          </div>

          <h1 className="mt-3 max-w-4xl text-[2.2rem] font-black leading-[0.94] tracking-[-0.04em] text-white [text-shadow:0_6px_26px_rgba(15,23,42,0.55)] sm:mt-4 sm:text-5xl lg:max-w-6xl lg:text-7xl xl:text-[5.4rem]">
            {t("homepageH1Short", getHeadline())}
          </h1>

          <p className="mt-3 max-w-[34rem] text-[0.95rem] font-medium leading-6 text-white/95 [text-shadow:0_2px_14px_rgba(15,23,42,0.5)] sm:mt-4 sm:text-base sm:leading-7 lg:max-w-4xl lg:text-xl">
            {t(
              "heroDescription",
              "Cele mai avansate jucării STEM concepute pentru a transforma joaca într-o experiență de învățare revoluționară."
            )}
          </p>

          <div className="mt-6 flex w-full max-w-4xl flex-col items-stretch gap-2.5 sm:mt-7 sm:flex-row sm:items-center sm:gap-4">
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
              className={`${gradientButtonClass} group relative flex min-h-[3.6rem] w-full items-center justify-between gap-3 overflow-hidden rounded-[1.15rem] px-4 py-2.5 text-left shadow-[0_20px_34px_-18px_rgba(37,99,235,0.62)] ring-1 ring-white/25 transition-all hover:-translate-y-0.5 hover:shadow-[0_28px_46px_-18px_rgba(14,165,233,0.58)] active:scale-[0.99] sm:min-h-[4.25rem] sm:min-w-[290px] sm:gap-4 sm:rounded-[1.35rem] sm:px-6 sm:py-3`}
            >
              <span
                aria-hidden
                className="absolute inset-y-0 -left-10 w-16 skew-x-[-20deg] bg-white/25 blur-sm transition-transform duration-700 group-hover:translate-x-[18rem]"
              />
              <span className="relative z-10 flex flex-col justify-center">
                <span className="text-[0.95rem] font-black uppercase text-white sm:text-[1.05rem]">
                  {primaryCtaText}
                </span>
              </span>
              <span className="relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-[0.95rem] bg-white/14 ring-1 ring-white/20 sm:h-10 sm:w-10 sm:rounded-2xl">
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
              className="group inline-flex min-h-[3.6rem] w-full items-center justify-between gap-3 rounded-[1.15rem] border border-white/55 bg-white/90 px-4 py-2.5 text-left text-slate-900 shadow-[0_14px_30px_-18px_rgba(15,23,42,0.45)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white sm:min-h-[4.25rem] sm:min-w-[290px] sm:gap-4 sm:rounded-[1.35rem] sm:px-6 sm:py-3"
            >
              <span className="flex flex-col justify-center">
                <span className="text-[0.95rem] font-black uppercase text-slate-950 sm:text-[1.05rem]">
                  {secondaryCtaText}
                </span>
              </span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[0.95rem] border border-slate-200 bg-slate-50 text-slate-700 transition group-hover:border-slate-300 group-hover:bg-white sm:h-10 sm:w-10 sm:rounded-2xl">
                <Layers3 className="h-4 w-4" />
              </span>
            </Link>
          </div>

          <div className="mt-4 flex w-full max-w-5xl flex-wrap items-center gap-2 sm:mt-5 sm:gap-2.5">
            {trustHighlights.map(item => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-2.5 py-1.5 text-[11px] font-semibold text-white/95 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.75)] backdrop-blur-md sm:px-3 sm:py-2 sm:text-xs"
                >
                  <span
                    aria-hidden
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 sm:h-6 sm:w-6"
                  >
                    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </span>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>


        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 animate-bounce opacity-70 sm:block">
        <ChevronDown className="h-6 w-6 text-white/90" />
      </div>
    </section>
  );
};

export const HeroSection = React.memo(HeroSectionComponent);
