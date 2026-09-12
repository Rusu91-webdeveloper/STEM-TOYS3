import { getShippingSettings } from "@/lib/utils/store-settings";
import { notFound } from "next/navigation";
import React from "react";

import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { getCombinedProduct } from "@/lib/api/products";
import { db } from "@/lib/db";
import { generateCompleteProductSchema } from "@/lib/seo/advanced-schema";
import { buildDefaultProductFaq } from "@/lib/seo/product-faq";
import type { Product } from "@/types/product";

import type { BundleContentItem } from "./BundleContents";
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

function parseBundleItemIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(value => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

async function fetchBundleContents(
  productId: string
): Promise<BundleContentItem[]> {
  const bundleMeta = await db.product.findUnique({
    where: { id: productId },
    select: {
      isBundle: true,
      bundleItems: true,
    },
  });

  if (!bundleMeta?.isBundle) return [];

  const itemIds = parseBundleItemIds(bundleMeta.bundleItems);
  if (itemIds.length === 0) return [];

  const bundleProducts = await db.product.findMany({
    where: {
      id: { in: itemIds },
      isBundle: false,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      images: true,
      price: true,
      stockQuantity: true,
      isActive: true,
    },
  });

  const bundleProductsById = new Map(bundleProducts.map(item => [item.id, item]));

  // Preserve bundle item order from bundleItems.
  const orderedItems: BundleContentItem[] = [];
  for (const itemId of itemIds) {
    const item = bundleProductsById.get(itemId);
    if (!item) continue;
    orderedItems.push({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description ?? "",
      images: item.images as string[],
      price: item.price,
      stockQuantity: item.stockQuantity,
      isActive: item.isActive,
    });
  }

  return orderedItems;
}

const ProductDetailServer = async ({ slug }: ProductDetailServerProps) => {
  // 🚀 PERFORMANCE: First get product data
  const product: Product | null = await getCombinedProduct(slug);

  // If product not found, trigger Next.js 404 page
  if (!product) {
    notFound();
  }

  const isBook = product.isBook === true;

  // 🚀 PERFORMANCE: Fetch secondary data in parallel.
  const reviewsPromise = fetchReviews(product.id);
  const bundleContentsPromise = isBook || product.isBundle !== true
    ? Promise.resolve([])
    : fetchBundleContents(product.id);

  const [reviews, bundleContents] = await Promise.all([
    reviewsPromise,
    bundleContentsPromise,
  ]);

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
    reviewsForSchema,
    undefined,
    await getShippingSettings()
  );
  const fallbackFaq = buildDefaultProductFaq(product);
  const productFaq =
    Array.isArray((product as any)?.metadata?.seo?.faq) &&
    (product as any).metadata.seo.faq.length > 0
      ? (product as any).metadata.seo.faq
      : fallbackFaq;

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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: productFaq.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const filteredProductSchemas = Array.isArray(productSchemas)
    ? productSchemas.filter(
        schema => schema && schema["@type"] !== "BreadcrumbList"
      )
    : [];

  const structuredData = [breadcrumbSchema, faqSchema, ...filteredProductSchemas];

  return (
    <>
      <SeoJsonLd data={structuredData} />
      <ProductDetailClient
        product={product}
        isBook={isBook}
        initialReviews={reviews}
        userLoggedIn={false}
        bundleContents={bundleContents}
        faq={productFaq}
      />
    </>
  );
};

export default ProductDetailServer;
