import { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import React from "react";

import ProductDetailServer from "@/features/products/components/ProductDetailServer";
import { getCombinedProduct } from "@/lib/api/products";
import { prisma } from "@/lib/prisma";
import { toPublicProductSlug } from "@/lib/products/public-slug";
import { generateProductMetadata } from "@/lib/utils/seo";

// ISR for known products. Unknown slugs are rendered on demand (see dynamicParams).
export const revalidate = 600;

/**
 * Allow slugs that were not known at build time.
 * `dynamicParams = false` returned HTTP 404 for every product created or
 * activated after the last deploy, and it was also how a stale slug blocklist
 * hard-404'd live products. Missing, inactive, and unapproved products call
 * `notFound()` in this segment so the response status is 404 (never a
 * "not found" page with HTTP 200). `noStore()` on that path keeps a 404 from
 * being cached over a product that appears later.
 */
export const dynamicParams = true;

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function productNotFound(): never {
  noStore();
  notFound();
}

/**
 * Prebuild active approved products and active books.
 * Out-of-stock products stay renderable. Slugs are the public form so a
 * stored slash becomes a single path segment.
 */
export async function generateStaticParams() {
  try {
    const [products, books] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          status: "APPROVED",
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

    const normalizedSlugs = Array.from(
      new Set(
        [
          ...products.map(product => product.slug),
          ...books.map(book => book.slug),
        ].map(slug => toPublicProductSlug(slug))
      )
    );

    return normalizedSlugs.map(slug => ({
      slug,
    }));
  } catch (error) {
    console.error(
      "[generateStaticParams] Error fetching product/book slugs:",
      error
    );
    // Throw so the build fails instead of publishing an empty catalog.
    throw error;
  }
}

async function loadPublicProduct(rawSlug: string) {
  const slug = toPublicProductSlug(rawSlug);
  const product = await getCombinedProduct(slug);

  if (!product || product.isActive === false) {
    return null;
  }

  return {
    ...product,
    slug: toPublicProductSlug(product.slug),
  };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const product = await loadPublicProduct(rawSlug);

  if (!product) {
    productNotFound();
  }

  return generateProductMetadata(product);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug: rawSlug } = await params;
  const product = await loadPublicProduct(rawSlug);

  if (!product) {
    productNotFound();
  }

  return <ProductDetailServer slug={product.slug} />;
}
