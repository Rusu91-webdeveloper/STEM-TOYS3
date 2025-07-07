import { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import ProductDetailServer from "@/features/products/components/ProductDetailServer";
import { generateProductMetadata } from "@/lib/utils/seo";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  // Await params for Next.js 15
  const { slug } = await params;
  // Use our SEO utility to generate metadata
  // (Assume product fetching and error handling is handled in the server component)
  return generateProductMetadata({ name: slug });
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    // Ensure params is resolved if it's a promise
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    // Pass slug to server component
    return <ProductDetailServer slug={slug} />;
  } catch (error) {
    console.error("Error fetching product:", error);
    return notFound();
  }
}
