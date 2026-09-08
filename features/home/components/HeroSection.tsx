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

  const trustHighlights = [
    { icon: Sparkles, label: t("heroTrust1", "Branduri premium europene") },
    { icon: Truck, label: t("heroTrust2", "Livrare 1–4 zile lucrătoare în România") },
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

  const getHeadline = () => t("homepageH1Short", "Inspirație. Creație. Viitor.");

  const primaryCtaText = t("heroPrimaryCta", "EXPLOREAZĂ COLECȚIA");
  const secondaryCtaText = t("heroSecondaryCta", "Vezi Categorii");

  return (
    <section
      className="relative mx-auto flex min-h-[620px] w-full max-w-[1480px] flex-col justify-center overflow-hidden border-white/70 bg-[#0b1220] shadow-[0_32px_90px_-54px_rgba(15,23,42,0.9)] sm:mt-4 sm:min-h-[620px] sm:w-[calc(100%-2rem)] sm:rounded-[2rem] sm:border lg:min-h-[660px]"
      aria-label={t("heroSection", "Homepage Hero Section")}
    >
      <div className="absolute inset-0 z-0 select-none">
        <Image
          src={HERO_IMAGE_SRC}
          alt={t("inspireMinds", "Inspire Curious Minds")}
          fill
          priority
          sizes="100vw"
          className="h-full w-full object-cover object-[58%_center] sm:object-center"
          fetchPriority="high"
          quality={85}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#06101f]/95 via-[#0b1d35]/66 to-[#0b1d35]/10"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_78%_14%,rgba(255,255,255,0.08),transparent_28%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.06),rgba(2,6,23,0.38))]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(2,6,23,0.74)_0%,rgba(2,6,23,0.34)_48%,rgba(2,6,23,0.04)_78%)]"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-5 py-10 sm:px-10 sm:py-14 lg:px-14 xl:px-16">
        <div className="animate-in slide-in-from-bottom-8 fade-in flex w-full flex-col text-left duration-1000 fill-mode-forwards">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.24em] text-sky-100 backdrop-blur-md sm:px-4 sm:text-[0.68rem]">
              <span
                className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.9)]"
                aria-hidden
              />
              {t("heroKicker", "VIITORUL EDUCAȚIEI")}
            </span>
          </div>

          <h1 className="mt-5 max-w-3xl text-[2.85rem] font-bold leading-[0.94] tracking-[-0.055em] text-white [text-shadow:0_8px_28px_rgba(2,6,23,0.4)] sm:text-6xl lg:text-[4.75rem] xl:text-[5.15rem]">
            {t("homepageH1Short", getHeadline())}
          </h1>

          <p className="mt-5 max-w-[38rem] text-[0.95rem] font-normal leading-6 text-slate-200 [text-shadow:0_2px_14px_rgba(15,23,42,0.5)] sm:text-lg sm:leading-8 lg:text-xl">
            {t(
              "heroDescription",
              "Cele mai avansate jucării STEM concepute pentru a transforma joaca într-o experiență de învățare revoluționară."
            )}
          </p>

          <div className="mt-8 flex w-full max-w-2xl flex-col items-stretch gap-3 sm:flex-row sm:items-center">
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
              className={`${gradientButtonClass} group relative flex min-h-14 w-full items-center justify-between gap-3 overflow-hidden rounded-xl px-5 py-3 text-left shadow-[0_18px_40px_-18px_rgba(37,99,235,0.8)] ring-1 ring-white/20 transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-20px_rgba(37,99,235,0.9)] active:scale-[0.99] sm:w-auto sm:min-w-[250px] sm:px-6`}
            >
              <span
                aria-hidden
                className="absolute inset-y-0 -left-10 w-16 skew-x-[-20deg] bg-white/25 blur-sm transition-transform duration-700 group-hover:translate-x-[18rem]"
              />
              <span className="relative z-10 flex flex-col justify-center">
                <span className="text-sm font-bold text-white sm:text-base">
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
              className="group inline-flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-left text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/15 sm:w-auto sm:min-w-[220px] sm:px-6"
            >
              <span className="flex flex-col justify-center">
                <span className="text-sm font-bold text-white sm:text-base">
                  {secondaryCtaText}
                </span>
              </span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition group-hover:bg-white/15">
                <Layers3 className="h-4 w-4" />
              </span>
            </Link>
          </div>

          <div className="mt-7 flex w-full max-w-3xl flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/15 pt-5">
            {trustHighlights.map(item => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-200 sm:text-xs"
                >
                  <span
                    aria-hidden
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-300/15 text-sky-200"
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

      <div className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 opacity-50 sm:block">
        <ChevronDown className="h-5 w-5 text-white/90" />
      </div>
    </section>
  );
};

export const HeroSection = React.memo(HeroSectionComponent);
