"use client";

import React from "react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";

import {
  productBodyTextClass,
  productDividerClass,
  productMutedTextClass,
  productSubSectionCardClass,
  productTitleClass,
} from "./productTheme";

type ProductSpecsProps = {
  product: any;
};

function humanizeAgeGroup(
  t: (key: string) => string,
  value?: string
): string | undefined {
  if (!value) return undefined;
  const key = `ageGroup.${value}`;
  const translated = (t as any)(key);
  return translated || value;
}

function humanizeStemDiscipline(value?: string): string | undefined {
  switch (value) {
    case "SCIENCE":
      return "Science";
    case "TECHNOLOGY":
      return "Technology";
    case "ENGINEERING":
      return "Engineering";
    case "MATHEMATICS":
      return "Mathematics";
    case "GENERAL":
      return "General";
    default:
      return undefined;
  }
}

function humanizeProductType(
  t: (key: string) => string,
  value?: string
): string | undefined {
  if (!value) return undefined;
  const key = `productType.${value}`;
  const translated = (t as any)(key);
  return translated || value;
}

function humanizeLearningOutcome(
  t: (key: string) => string,
  value?: string
): string | undefined {
  if (!value) return undefined;
  const key = `learningOutcome.${value}`;
  const translated = (t as any)(key);
  return translated || value;
}

function humanizeSpecialCategory(
  t: (key: string) => string,
  value?: string
): string | undefined {
  if (!value) return undefined;
  const key = `specialCategory.${value}`;
  const translated = (t as any)(key);
  return translated || value;
}

export default function ProductSpecs({ product }: ProductSpecsProps) {
  const { t } = useTranslation();
  const manufacturerAge =
    product.ageRange ||
    product.attributes?.manufacturerRecommendedAge ||
    product.attributes?.originalAgeText;
  const entries: Array<{ label: string; value?: React.ReactNode }> = [
    // Removed SKU/GTIN/Dimensions/Weight from UI as requested
    {
      label: manufacturerAge ? "Încadrare ghid cadouri" : t("ageGroup"),
      value: humanizeAgeGroup(t as any, product.ageGroup),
    },
    {
      label: "Vârsta recomandată de producător",
      value: manufacturerAge,
    },
    {
      label: t("learningOutcomes"),
      value: Array.isArray(product.learningOutcomes)
        ? product.learningOutcomes
            .map((v: string) => humanizeLearningOutcome(t as any, v) || v)
            .join(", ")
        : undefined,
    },
    {
      label: t("productType"),
      value: humanizeProductType(t as any, product.productType),
    },
    {
      label: t("specialCategories"),
      value: Array.isArray(product.specialCategories)
        ? product.specialCategories
            .map((v: string) => humanizeSpecialCategory(t as any, v) || v)
            .join(", ")
        : undefined,
    },
    {
      label: "STEM Discipline",
      value: humanizeStemDiscipline(product.stemDiscipline),
    },
  ];

  const manufacturerBrand = product?.attributes?.brand;
  const supplierBrand = product?.supplier?.companyName;
  const brand = manufacturerBrand || supplierBrand;
  const tags: string[] = Array.isArray(product.tags) ? product.tags : [];

  const visible = entries.filter(e => !!e.value);

  if (visible.length === 0 && !brand && tags.length === 0) {
    return null;
  }

  return (
    <div className={`${productSubSectionCardClass} space-y-4`}>
      <h3 className={productTitleClass}>{t("features") || "Specifications"}</h3>
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {visible.map((e, idx) => (
          <div
            key={idx}
            className="flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
          >
            <span className={`${productMutedTextClass} text-xs sm:text-sm`}>
              {e.label}
            </span>
            <span
              className={`${productBodyTextClass} break-words text-left text-xs sm:text-right sm:text-sm`}
            >
              {e.value as any}
            </span>
          </div>
        ))}
      </div>

      {(brand || tags.length > 0) && (
        <Separator className={productDividerClass} />
      )}

      {brand && (
        <div className="mb-2 flex flex-wrap items-baseline gap-2">
          <span className={`${productMutedTextClass} text-xs sm:text-sm`}>
            Brand
          </span>
          {manufacturerBrand ? (
            <span className="text-xs font-medium text-emerald-700 sm:text-sm">
              {manufacturerBrand}
            </span>
          ) : (
            <a
              href={`/supplier/${product?.supplier?.companySlug ?? ""}`}
              className="text-xs font-medium text-emerald-700 underline decoration-emerald-500/30 underline-offset-4 transition hover:text-emerald-800 sm:text-sm"
            >
              {supplierBrand}
            </a>
          )}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: string) => (
            <Badge
              key={tag}
              variant="secondary"
              className="border-slate-200 bg-slate-100 text-xs text-slate-700 shadow-sm"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
