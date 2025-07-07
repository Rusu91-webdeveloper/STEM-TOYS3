import React from "react";

import { LazyProductReviews } from "@/components/lazy/server";
import { getCombinedProduct } from "@/lib/api/products";
import type { Product } from "@/types/product";

import ProductDetailClient from "./ProductDetailClient";
import { Review } from "./ProductReviews";

interface ProductDetailServerProps {
  slug: string;
}

async function fetchReviews(productId: string): Promise<Review[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/reviews?productId=${productId}`
  );
  if (!res.ok) return [];
  return res.json();
}

const ProductDetailServer = async ({ slug }: ProductDetailServerProps) => {
  const product: Product | null = await getCombinedProduct(slug);
  if (!product) return null;
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
