import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Edit Product | Admin Dashboard",
  description: "Edit product information and SEO settings.",
};

interface EditProductPageProps {
  params: {
    id: string;
  };
}

async function getProduct(id: string) {
  try {
    // In development with mock data, we'd return a mock product
    if (
      process.env.NODE_ENV === "development" &&
      process.env.USE_MOCK_DATA === "true"
    ) {
      return {
        id: id,
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
        ageRange: "6-8",
        stemCategory: "science",
        difficultyLevel: "beginner",
        learningObjectives: ["Learn about mock data", "Understand development"],
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

    // Parse the attributes for the form
    const attributes = (product.attributes as Record<string, any>) || {};

    // Ensure images is always an array
    const images = Array.isArray(product.images) ? product.images : [];

    return {
      ...product,
      // Make sure images is correctly formatted
      images,
      // Extract SEO and other custom fields from attributes
      metaTitle: attributes.metaTitle || product.name,
      metaDescription:
        attributes.metaDescription || product.description.substring(0, 160),
      metaKeywords: attributes.metaKeywords || [],
      ageRange: attributes.ageRange || "",
      stemCategory: attributes.stemCategory || "",
      difficultyLevel: attributes.difficultyLevel || "",
      learningObjectives: attributes.learningObjectives || [],
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
          Make changes to your product "{product.name}" including SEO settings.
        </p>
      </div>

      <ProductForm
        initialData={product}
        isEditing={true}
      />
    </div>
  );
}
