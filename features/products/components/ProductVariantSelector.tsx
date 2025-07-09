"use client";

import React from "react";

import {
  VariantSelector,
  type Variant,
} from "@/components/products/VariantSelector";

import { useProductVariant } from "../context/ProductVariantContext";

interface ProductVariantSelectorProps {
  productId: string;
  variants: Variant[];
  className?: string;
}

export function ProductVariantSelector({
  productId,
  variants,
  className,
}: ProductVariantSelectorProps) {
  const { selectedVariants, selectVariant } = useProductVariant();

  const selectedVariantId = selectedVariants[productId];

  const handleVariantChange = (variantId: string | undefined) => {
    selectVariant(productId, variantId);
  };

  // Don't render if there are no variants or only one variant
  if (!variants || variants.length <= 1) {
    return null;
  }

  return (
    <VariantSelector
      variants={variants}
      selectedVariantId={selectedVariantId}
      onVariantChange={handleVariantChange}
      className={className}
    />
  );
}
