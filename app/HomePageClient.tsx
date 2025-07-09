"use client";

import React from "react";

import type { Product } from "@/types/product";

// Temporary simplified version to debug Vercel build issues
export default function HomePageClient({
  initialFeaturedProducts,
}: {
  initialFeaturedProducts: Product[];
}) {
  return (
    <div className="flex flex-col">
      <div className="py-20 text-center">
        <h1 className="text-4xl font-bold">Welcome to TechTots</h1>
        <p className="mt-4 text-lg text-gray-600">
          Educational STEM toys for young minds
        </p>
      </div>

      <div className="py-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Featured Products</h2>
        <p className="text-gray-600">
          {initialFeaturedProducts?.length || 0} products available
        </p>
      </div>
    </div>
  );
}
