import { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import ProductDetailServer from "@/features/products/components/ProductDetailServer";
import { getCombinedProduct } from "@/lib/api/products";
import { generateProductMetadata } from "@/lib/utils/seo";

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
    const { slug } = await params;

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
    const slug = resolvedParams.slug;

    // Pass slug to server component
    return <ProductDetailServer slug={slug} />;
  } catch (error) {
    console.error("Error fetching product:", error);
    return notFound();
  }
}
