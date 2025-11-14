import { notFound } from "next/navigation";
import React from "react";

import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { getCombinedProduct } from "@/lib/api/products";
import { generateCompleteProductSchema } from "@/lib/seo/advanced-schema";
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

    const res = await fetch(url, {
      next: {
        revalidate: 300, // Cache for 5 minutes
        tags: [`reviews-${productId}`],
      },
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return [];
  }
}

const ProductDetailServer = async ({ slug }: ProductDetailServerProps) => {
  // 🚀 PERFORMANCE: First get product data
  const product: Product | null = await getCombinedProduct(slug);

  // If product not found, trigger Next.js 404 page
  if (!product) {
    notFound();
  }

  // 🚀 PERFORMANCE: Fetch reviews asynchronously without awaiting
  const reviewsPromise = fetchReviews(product.id);

  const isBook = product.isBook === true;

  // 🚀 PERFORMANCE: Start fetching reviews but don't await - let components handle the promise
  const reviews = await reviewsPromise;

  const reviewsForSchema = reviews
    .filter(
      review =>
        typeof review.rating === "number" &&
        review.userName &&
        (review.content || review.title)
    )
    .map(review => ({
      authorName: review.userName,
      rating: review.rating,
      comment: review.content || review.title,
      createdAt: review.date,
    }));

  const productSchemas = generateCompleteProductSchema(
    product,
    reviewsForSchema
  );

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.techtots.ro/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: "https://www.techtots.ro/products",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `https://www.techtots.ro/products/${product.slug}`,
      },
    ],
  };

  const filteredProductSchemas = Array.isArray(productSchemas)
    ? productSchemas.filter(
        schema => schema && schema["@type"] !== "BreadcrumbList"
      )
    : [];

  const structuredData = [breadcrumbSchema, ...filteredProductSchemas];

  return (
    <>
      <SeoJsonLd data={structuredData} />
      <ProductDetailClient
        product={product}
        isBook={isBook}
        initialReviews={reviews}
        userLoggedIn={false}
      />
    </>
  );
};

export default ProductDetailServer;
