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
 * Generate static params for all active products AND books
 * Excludes soft-404 (blocklisted) products
 * This enables routing-level HTTP 404 for unknown slugs (same pattern as categories)
 * 
 * IMPORTANT: 
 * - Includes both products AND books (combined API serves both under /products/[slug])
 * - Allows OOS products (historically show out-of-stock pages, not hard 404)
 * - Only hard-404s the blocklist (SOFT_404_PRODUCT_SLUGS)
 * - Normalizes slugs same as page to prevent case/slash bypass
 */
export async function generateStaticParams() {
  try {
    // Query both products and books in parallel (combined API serves both)
    const [products, books] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          status: "APPROVED",
          // NOTE: No stockQuantity filter - OOS products show OOS page, not 404
        },
        select: {
          slug: true,
        },
      }),
      prisma.book.findMany({
        where: {
          isActive: true,
        },
        select: {
          slug: true,
        },
      }),
    ]);

    // Combine product and book slugs
    const allSlugs = [
      ...products.map(p => p.slug),
      ...books.map(b => b.slug),
    ];

    // Normalize slugs (same as page does) and dedupe
    const normalizedSlugs = Array.from(
      new Set(allSlugs.map(slug => normalizeProductSlug(slug)))
    );

    // Exclude blocklist (case-insensitive check)
    const validSlugs = normalizedSlugs.filter(
      slug => !SOFT_404_PRODUCT_SLUGS.has(slug.toLowerCase())
    );

    return validSlugs.map(slug => ({
      slug,
    }));
  } catch (error) {
    console.error("[generateStaticParams] Error fetching product/book slugs:", error);
    // IMPORTANT: Throw error instead of returning [] to fail the build
    // Returning [] would 404 the entire catalog on deploy
    throw error;
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  // Await params for Next.js 15
  const { slug: rawSlug } = await params;
  const slug = normalizeProductSlug(rawSlug);

  // Belt-and-suspenders: Block soft-404 products early (in addition to generateStaticParams)
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

  // Belt-and-suspenders: Block soft-404 products early (in addition to generateStaticParams)
  if (SOFT_404_PRODUCT_SLUGS.has(slug)) {
    notFound();
  }

  // 🚀 PERFORMANCE: Pass slug to server component with improved error handling
  return <ProductDetailServer slug={slug} />;
}
