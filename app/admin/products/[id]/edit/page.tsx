import { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import ProductForm from "@/components/admin/ProductForm";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Edit Product | Admin Dashboard",
  description: "Edit product information and SEO settings.",
};

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProduct(id: string) {
  try {
    // Fetch the saved product in every environment.
    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return null;
    }

    // Parse the attributes and metadata for the form
    const attributes = (product.attributes as Record<string, any>) || {};
    const metadata = (product.metadata as Record<string, any>) || {};

    // Ensure images is always an array
    const images = Array.isArray(product.images) ? product.images : [];

    // Map database data to form fields, providing defaults for null/undefined values
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      price: product.price || 0,
      compareAtPrice: product.compareAtPrice || null,
      stock: product.stockQuantity || 0, // Map stockQuantity to stock
      images,
      categoryId: product.categoryId || "",
      tags: Array.isArray(product.tags) ? product.tags : [],
      isActive: product.isActive,
      featured: product.featured || false,
      // SEO fields from metadata
      metaTitle: metadata.metaTitle || product.name || "",
      metaDescription:
        metadata.metaDescription ||
        product.description?.substring(0, 160) ||
        "",
      metaKeywords: metadata.keywords || [],
      // STEM fields - map from database fields to form fields
      ageGroup: product.ageGroup || undefined,
      stemDiscipline: product.stemDiscipline || "GENERAL",
      learningOutcomes: Array.isArray(attributes.learningOutcomes)
        ? attributes.learningOutcomes
        : [],
      productType: (attributes.productType as string) || undefined,
      specialCategories: Array.isArray(attributes.specialCategories)
        ? attributes.specialCategories
        : [],
      difficultyLevel: attributes.difficultyLevel || "",
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-muted-foreground">
          Make changes to your product &quot;{product.name}&quot; including SEO
          settings.
        </p>
      </div>

      <ProductForm initialData={product} isEditing={true} />
    </div>
  );
}
