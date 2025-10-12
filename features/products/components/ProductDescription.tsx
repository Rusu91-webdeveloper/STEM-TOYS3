"use client";

import React from "react";

interface ProductDescriptionProps {
  description: string;
  categoryName: string;
  t: (key: string, fallback?: string) => string;
}

/**
 * Product description section component
 */
export function ProductDescription({
  description,
  categoryName,
  t,
}: ProductDescriptionProps) {
  return (
    <div className="bg-white rounded-lg border p-3 sm:p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-2">
        {t("productDescription", "Descriere produs")}
      </h2>
      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
        {description}
      </p>
      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mt-2">
        {t("stemToyDesigned", "Jucărie STEM concepută pentru")} {categoryName}.{" "}
        {t("providesHandsOn", "Oferă experiențe practice de învățare.")}
      </p>
    </div>
  );
}
