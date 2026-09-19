import { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import ProductDetailServer from "@/features/products/components/ProductDetailServer";
import { getCombinedProduct } from "@/lib/api/products";
import { prisma } from "@/lib/prisma";
import { SOFT_404_PRODUCT_SLUGS } from "@/lib/sitemap/blocklist";
import { generateProductMetadata } from "@/lib/utils/seo";

// 🚀 PERFORMANCE: Enable ISR with 10 minutes revalidation (matching categories)
export const revalidate = 600;

// Force routing-level HTTP 404 for unknown product slugs (matching categories pattern)
export const dynamicParams = false;

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

/**
 * Generate static params for all active, sellable products
 * Excludes soft-404 (blocklisted) products
 * This enables routing-level HTTP 404 for unknown slugs (same pattern as categories)
 */
export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        status: "APPROVED",
        stockQuantity: { gt: 0 },
        // Exclude soft-404 products (case-insensitive)
        AND: Array.from(SOFT_404_PRODUCT_SLUGS).map(blockedSlug => ({
          slug: { not: { equals: blockedSlug, mode: "insensitive" } },
        })),
      },
      select: {
        slug: true,
      },
    });

    return products.map(product => ({
      slug: product.slug,
    }));
  } catch (error) {
    console.error("[generateStaticParams] Error fetching product slugs:", error);
    // Return empty array on error - all products will 404
    return [];
  }
}

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
