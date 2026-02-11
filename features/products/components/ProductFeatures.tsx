"use client";

import React from "react";
import { ShoppingCart, Truck, RotateCcw } from "lucide-react";
import { formatPrice } from "@/lib/email/base";

import {
  productBodyTextClass,
  productMutedTextClass,
  productSectionCardClass,
  productSubSectionCardClass,
  productTitleClass,
} from "./productTheme";

interface ProductFeaturesProps {
  isFreeShippingActive: boolean;
  freeShippingThreshold: number | null;
  categoryName: string;
  productSlug: string;
  t: (key: string, fallback?: string) => string;
}

/**
 * Product features component showing shipping info, benefits, and learn more links
 */
export function ProductFeatures({
  isFreeShippingActive,
  freeShippingThreshold,
  categoryName,
  productSlug,
  t,
}: ProductFeaturesProps) {
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Product Features - Single Row */}
      <div className={`${productSectionCardClass} space-y-4`}>
        <h3 className={productTitleClass}>
          {t("productFeatures", "Caracteristici produs")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
              <ShoppingCart className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {t("securePayment", "Plată securizată")}
              </div>
              <div className={`${productMutedTextClass} text-xs`}>
                {t("sslProtected", "SSL Protected")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20">
              <Truck className="h-4 w-4 text-sky-700" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {t("freeShipping", "Transport gratuit")}
              </div>
              <div className={`${productMutedTextClass} text-xs`}>
                {isFreeShippingActive && freeShippingThreshold
                  ? `${t("over", "Peste")} ${formatPrice(freeShippingThreshold)}`
                  : t("notAvailable", "Indisponibil")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-orange-400/20 bg-orange-400/10 px-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20">
              <RotateCcw className="h-4 w-4 text-orange-700" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {t("easyReturns", "Retur simplu")}
              </div>
              <div className={`${productMutedTextClass} text-xs`}>
                {t("dayPolicy", "Politică 30 zile")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Features & Benefits */}
      <div className={`${productSubSectionCardClass} space-y-4`}>
        <h3 className={productTitleClass}>
          {t("featuresBenefits", "Caracteristici și beneficii")}
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-sky-400" />
              <span className={productBodyTextClass}>
                {t(
                  "developsCriticalThinking",
                  "Dezvoltă gândirea critică și logica"
                )}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
              <span className={productBodyTextClass}>
                {t("encouragesCreativity", "Încurajează creativitatea")}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-violet-400" />
              <span className={productBodyTextClass}>
                {t("buildsConfidence", "Construiește încrederea în sine")}
              </span>
            </li>
          </ul>

          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-orange-400" />
              <span className={productBodyTextClass}>
                {t(
                  "teachesFundamentalConcepts",
                  "Predă concepte fundamentale de"
                )}{" "}
                {categoryName} {t("inEngagingWay", "într-un mod captivant")}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-rose-400" />
              <span className={productBodyTextClass}>
                {t("safeMaterials", "Materiale sigure și de calitate")}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Learn More Resources */}
      <div className={`${productSubSectionCardClass} space-y-3`}>
        <h3 className={productTitleClass}>{t("learnMore", "Află mai multe")}</h3>
        <p className={`${productMutedTextClass} text-xs sm:text-sm`}>
          {t(
            "usefulGuides",
            "Ghiduri utile pentru a alege și folosi jucăriile STEM:"
          )}
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <a
            className="font-medium text-emerald-700 underline decoration-emerald-500/40 underline-offset-4 transition hover:text-emerald-800"
            href="/ghid-jucarii-stem-2025"
            data-conversion="cta"
            data-conversion-type="click"
            data-conversion-category="product"
            data-conversion-action="learn_more_click"
            data-conversion-element={`prod_${productSlug}_ghid_2025`}
          >
            {t("guide2025", "Ghid 2025")}
          </a>
          <span className={productMutedTextClass}>·</span>
          <a
            className="font-medium text-emerald-700 underline decoration-emerald-500/40 underline-offset-4 transition hover:text-emerald-800"
            href="/jucarii-stem-dupa-varsta"
            data-conversion="cta"
            data-conversion-type="click"
            data-conversion-category="product"
            data-conversion-action="learn_more_click"
            data-conversion-element={`prod_${productSlug}_dupa_varsta`}
          >
            {t("byAge", "După vârstă")}
          </a>
          <span className={productMutedTextClass}>·</span>
          <a
            className="font-medium text-emerald-700 underline decoration-emerald-500/40 underline-offset-4 transition hover:text-emerald-800"
            href="/beneficiile-jucariilor-stem"
            data-conversion="cta"
            data-conversion-type="click"
            data-conversion-category="product"
            data-conversion-action="learn_more_click"
            data-conversion-element={`prod_${productSlug}_beneficii`}
          >
            {t("stemBenefits", "Beneficii STEM")}
          </a>
          <span className={productMutedTextClass}>·</span>
          <a
            className="font-medium text-emerald-700 underline decoration-emerald-500/40 underline-offset-4 transition hover:text-emerald-800"
            href="/faq"
            data-conversion="cta"
            data-conversion-type="click"
            data-conversion-category="product"
            data-conversion-action="learn_more_click"
            data-conversion-element={`prod_${productSlug}_faq`}
          >
            FAQ
          </a>
        </div>
      </div>
    </div>
  );
}
