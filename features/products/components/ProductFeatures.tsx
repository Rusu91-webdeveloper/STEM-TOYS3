"use client";

import React from "react";
import { ShoppingCart, Truck, RotateCcw } from "lucide-react";
import { formatPrice } from "@/lib/email/base";

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
    <div className="space-y-8 sm:space-y-12">
      {/* Product Features - Single Row */}
      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          {t("productFeatures", "Caracteristici produs")}
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-green-100 rounded-full">
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-xs">
              <div className="font-medium">
                {t("securePayment", "Plată securizată")}
              </div>
              <div className="text-muted-foreground">
                {t("sslProtected", "SSL Protected")}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xs">
              <div className="font-medium">
                {t("freeShipping", "Transport gratuit")}
              </div>
              <div className="text-muted-foreground">
                {isFreeShippingActive && freeShippingThreshold
                  ? `${t("over", "Peste")} ${formatPrice(freeShippingThreshold)}`
                  : t("notAvailable", "Indisponibil")}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-orange-100 rounded-full">
              <RotateCcw className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-xs">
              <div className="font-medium">
                {t("easyReturns", "Retur simplu")}
              </div>
              <div className="text-muted-foreground">
                {t("dayPolicy", "Politică 30 zile")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Features & Benefits */}
      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          {t("featuresBenefits", "Caracteristici și beneficii")}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <ul className="space-y-1.5 sm:space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-700">
                {t(
                  "developsCriticalThinking",
                  "Dezvoltă gândirea critică și logica"
                )}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-700">
                {t("encouragesCreativity", "Încurajează creativitatea")}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-700">
                {t("buildsConfidence", "Construiește încrederea în sine")}
              </span>
            </li>
          </ul>

          <ul className="space-y-1.5 sm:space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-700">
                {t(
                  "teachesFundamentalConcepts",
                  "Predă concepte fundamentale de"
                )}{" "}
                {categoryName} {t("inEngagingWay", "într-un mod captivant")}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-700">
                {t("safeMaterials", "Materiale sigure și de calitate")}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Learn More Resources */}
      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <h3 className="text-sm font-semibold mb-2">
          {t("learnMore", "Află mai multe")}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">
          {t(
            "usefulGuides",
            "Ghiduri utile pentru a alege și folosi jucăriile STEM:"
          )}
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <a
            className="underline hover:text-primary transition-colors"
            href="/ghid-jucarii-stem-2025"
            data-conversion="cta"
            data-conversion-type="click"
            data-conversion-category="product"
            data-conversion-action="learn_more_click"
            data-conversion-element={`prod_${productSlug}_ghid_2025`}
          >
            {t("guide2025", "Ghid 2025")}
          </a>
          <span className="text-muted-foreground">·</span>
          <a
            className="underline hover:text-primary transition-colors"
            href="/jucarii-stem-dupa-varsta"
            data-conversion="cta"
            data-conversion-type="click"
            data-conversion-category="product"
            data-conversion-action="learn_more_click"
            data-conversion-element={`prod_${productSlug}_dupa_varsta`}
          >
            {t("byAge", "După vârstă")}
          </a>
          <span className="text-muted-foreground">·</span>
          <a
            className="underline hover:text-primary transition-colors"
            href="/beneficiile-jucariilor-stem"
            data-conversion="cta"
            data-conversion-type="click"
            data-conversion-category="product"
            data-conversion-action="learn_more_click"
            data-conversion-element={`prod_${productSlug}_beneficii`}
          >
            {t("stemBenefits", "Beneficii STEM")}
          </a>
          <span className="text-muted-foreground">·</span>
          <a
            className="underline hover:text-primary transition-colors"
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
