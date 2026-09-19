import { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import ProductDetailServer from "@/features/products/components/ProductDetailServer";
import { getCombinedProduct } from "@/lib/api/products";
import { SOFT_404_PRODUCT_SLUGS } from "@/lib/sitemap/blocklist";
import { generateProductMetadata } from "@/lib/utils/seo";

// Force dynamic rendering to ensure notFound() produces HTTP 404 (not cached as 200)
// Note: Removed conflicting 'revalidate = 300' which prevented proper 404 status in Next.js 15
export const dynamic = "force-dynamic";

/**
 * Normalize slug to handle special characters and redirects
 * Fixes: A04 - giroscop slug with slash issue
 */
function normalizeProductSlug(slug: string): string {
  return slug
    .replace(/\//g, "-") // Replace slashes with hyphens
    .replace(/%2F/gi, "-") // Replace URL-encoded slashes with hyphens
    .toLowerCase()
    .trim();
}

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  // Await params for Next.js 15
  const { slug: rawSlug } = await params;
  const slug = normalizeProductSlug(rawSlug);

  // CRITICAL: Check blocklist BEFORE fetching product to ensure HTTP 404 for blocked products
  if (SOFT_404_PRODUCT_SLUGS.has(slug)) {
    notFound();
  }

  // Fetch the actual product for metadata generation
  const product = await getCombinedProduct(slug);

  if (!product) {
    // Trigger 404 for non-existent products
    // Don't wrap in try/catch - let Next.js handle the notFound() throw
    notFound();
  }

  // Use our SEO utility to generate metadata with the actual product data
  return generateProductMetadata(product);
}

export default async function ProductPage({ params }: ProductPageProps) {
  // Ensure params is resolved if it's a promise
  const resolvedParams = await params;
  const rawSlug = resolvedParams.slug;
  const slug = normalizeProductSlug(rawSlug);

  // CRITICAL: Check blocklist BEFORE rendering to ensure HTTP 404
  // This early check ensures Next.js sets proper 404 status before any component rendering
  if (SOFT_404_PRODUCT_SLUGS.has(slug)) {
    notFound();
  }

  // 🚀 PERFORMANCE: Pass slug to server component with improved error handling
  return <ProductDetailServer slug={slug} />;
}
