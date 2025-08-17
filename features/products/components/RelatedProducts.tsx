"use client";

import React from "react";

import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

import { ProductCard } from "./ProductCard";

interface RelatedProductsProps {
  currentProductId: string;
  products: Product[];
  title?: string;
  className?: string;
  maxItems?: number;
}

export function RelatedProducts({
  currentProductId,
  products,
  title = "Related Products",
  className,
  maxItems = 4,
}: RelatedProductsProps) {
  // Filter out the current product
  const filteredProducts = products
    .filter(product => product.id !== currentProductId)
    .slice(0, maxItems);

  if (filteredProducts.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            layout="grid"
            imageHeight={200}
          />
        ))}
      </div>
    </div>
  );
}
