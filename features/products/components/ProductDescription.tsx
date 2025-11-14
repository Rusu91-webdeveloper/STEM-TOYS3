"use client";

import React from "react";

import { cn } from "@/lib/utils";

import {
  productBodyTextClass,
  productSubSectionCardClass,
  productTitleClass,
} from "./productTheme";

interface ProductDescriptionProps {
  description: string;
  categoryName: string;
  t: (key: string, fallback?: string) => string;
  className?: string;
}

/**
 * Product description section component
 */
export function ProductDescription({
  description,
  categoryName,
  t,
  className,
}: ProductDescriptionProps) {
  return (
    <div
      className={cn(
        productSubSectionCardClass,
        "space-y-2.5 sm:space-y-3.5",
        className
      )}
    >
      <h2 className={productTitleClass}>
        {t("productDescription", "Descriere produs")}
      </h2>
      <p className={productBodyTextClass}>
        {description}
      </p>
      <p className={`${productBodyTextClass} pt-1`}>
        {t("stemToyDesigned", "Jucărie STEM concepută pentru")} {categoryName}.{" "}
        {t("providesHandsOn", "Oferă experiențe practice de învățare.")}
      </p>
    </div>
  );
}
