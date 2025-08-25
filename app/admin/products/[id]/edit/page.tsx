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
    // In development with mock data, we'd return a mock product
    if (
      process.env.NODE_ENV === "development" &&
      process.env.USE_MOCK_DATA === "true"
    ) {
      return {
        id,
        name: "Mock Product",
        slug: "mock-product",
        description: "This is a mock product for development.",
        price: 49.99,
        compareAtPrice: 59.99,
        images: [
          "https://placehold.co/800x600/4F46E5/FFFFFF.png?text=Mock+Product",
        ],
        categoryId: "cat_1",
        tags: ["mock", "development"],
        isActive: true,
        // SEO fields
        metaTitle: "Mock Product | STEM Toys",
        metaDescription: "A mock product for development purposes.",
        metaKeywords: ["mock", "development", "stem"],
        ageGroup: "ELEMENTARY_6_8",
        stemDiscipline: "SCIENCE",
        difficultyLevel: "beginner",
        learningOutcomes: ["PROBLEM_SOLVING", "CRITICAL_THINKING"],
        productType: "EXPERIMENT_KITS",
        specialCategories: ["NEW_ARRIVALS"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // In production, fetch from database
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
      learningOutcomes: Array.isArray(product.learningOutcomes)
        ? product.learningOutcomes
        : [],
      productType: product.productType || undefined,
      specialCategories: Array.isArray(product.specialCategories)
        ? product.specialCategories
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
