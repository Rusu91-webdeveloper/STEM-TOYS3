import React from "react";
import { notFound } from "next/navigation";

import { LazyProductReviews } from "@/components/lazy/client";
import { getCombinedProduct } from "@/lib/api/products";
import type { Product } from "@/types/product";

import ProductDetailClient from "./ProductDetailClient";
import { Review } from "./ProductReviews";

interface ProductDetailServerProps {
  slug: string;
}

async function fetchReviews(productId: string): Promise<Review[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/reviews?productId=${productId}`;

    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return [];
  }
}

const ProductDetailServer = async ({ slug }: ProductDetailServerProps) => {
  const product: Product | null = await getCombinedProduct(slug);

  // If product not found, trigger Next.js 404 page
  if (!product) {
    notFound();
  }

  const isBook = product.isBook === true;
  const reviews = await fetchReviews(product.id);

  return (
    <>
      <ProductDetailClient product={product} isBook={isBook} />
      <div className="mt-16">
        <LazyProductReviews
          productId={product.id}
          reviews={reviews}
          userLoggedIn={false} // You can enhance this with session logic if needed
        />
      </div>
    </>
  );
};

export default ProductDetailServer;
