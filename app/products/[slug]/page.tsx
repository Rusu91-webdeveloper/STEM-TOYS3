import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import ProductDetailClient from "@/features/products/components/ProductDetailClient";
import { getCombinedProduct } from "@/lib/api/products";
import { generateProductMetadata } from "@/lib/utils/seo";
import type { Product } from "@/types/product";

type ProductPageProps = {
  params: {
    slug: string;
  };
};

// Define Category type to fix type errors
type Category = {
  id?: string;
  name: string;
  slug: string;
  description?: string;
};

export async function generateMetadata(
  { params }: ProductPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Get product data
  try {
    // Ensure params is resolved if it's a promise
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    // Get product or book using the combined API
    const product = await getCombinedProduct(slug);

    if (!product) {
      return {
        title: "Product Not Found",
        description: "The requested product could not be found",
      };
    }

    // Use our SEO utility to generate metadata
    return generateProductMetadata(product);
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Product | TechTots",
      description: "Explore our STEM toys and educational products",
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    // Ensure params is resolved if it's a promise
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    // Get product or book using the combined API
    const product = await getCombinedProduct(slug);

    // Check if this is a book (based on the flag set in the API)
    const isBook = product?.isBook === true;

    if (!product) {
      return notFound();
    }

    // Pass product data to client component
    return <ProductDetailClient product={product} isBook={isBook} />;
  } catch (error) {
    console.error("Error fetching product:", error);
    return notFound();
  }
}
