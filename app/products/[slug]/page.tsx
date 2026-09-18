import { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import ProductDetailServer from "@/features/products/components/ProductDetailServer";
import { getCombinedProduct } from "@/lib/api/products";
import { generateProductMetadata } from "@/lib/utils/seo";

// 🚀 PERFORMANCE: Enable ISR for faster subsequent loads
export const revalidate = 300; // Revalidate every 5 minutes

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
  try {
    // Await params for Next.js 15
    const { slug: rawSlug } = await params;
    const slug = normalizeProductSlug(rawSlug);

    // Fetch the actual product for metadata generation
    const product = await getCombinedProduct(slug);

    if (!product) {
      // Return basic metadata for non-existent products
      return {
        title: "Product Not Found | TechTots",
        description: "The requested product could not be found.",
      };
    }

    // Use our SEO utility to generate metadata with the actual product data
    return generateProductMetadata(product);
  } catch (error) {
    console.error("Error generating product metadata:", error);
    return {
      title: "Product Not Found | TechTots",
      description: "The requested product could not be found.",
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    // Ensure params is resolved if it's a promise
    const resolvedParams = await params;
    const rawSlug = resolvedParams.slug;
    const slug = normalizeProductSlug(rawSlug);

    // 🚀 PERFORMANCE: Pass slug to server component with improved error handling
    return <ProductDetailServer slug={slug} />;
  } catch (error) {
    console.error("Error fetching product:", error);
    return notFound();
  }
}
