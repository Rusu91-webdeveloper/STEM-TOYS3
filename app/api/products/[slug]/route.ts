import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import type { Product } from "@/types/product";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const dbProduct = await db.product.findUnique({
      where: {
        slug,
      },
      include: {
        category: true,
      },
    });

    if (!dbProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Process the product to ensure ageRange and category are properly formatted
    const attributes = (dbProduct.attributes as Record<string, any>) || {};

    // Create a properly typed product object for the frontend
    const transformedProduct: Product = {
      id: dbProduct.id,
      name: dbProduct.name,
      slug: dbProduct.slug,
      description: dbProduct.description ?? "",
      price: dbProduct.price,
      compareAtPrice: dbProduct.compareAtPrice ?? undefined,
      images: dbProduct.images as string[],
      tags: dbProduct.tags as string[],
      attributes: dbProduct.attributes as Record<string, string> | undefined,
      isActive: dbProduct.isActive,
      featured: dbProduct.featured,
      // Set ageRange from attributes.age
      ageRange: attributes?.age as string,
      // Ensure category is available
      category: dbProduct.category?.name,
      // Set stemCategory from category
      stemCategory: dbProduct.category?.name?.toLowerCase(),
      stockQuantity: dbProduct.stockQuantity,
      reservedQuantity: dbProduct.reservedQuantity,
      // Pass through any other properties
      ...((dbProduct as any).categoryId
        ? { categoryId: (dbProduct as any).categoryId }
        : {}),
    };

    console.log("Transformed product:", {
      id: transformedProduct.id,
      name: transformedProduct.name,
      ageRange: transformedProduct.ageRange,
      category: transformedProduct.category,
      stemCategory: transformedProduct.stemCategory,
    });

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const data = await request.json();

    // Only allow updating specific fields
    const allowedFields = [
      "featured",
      "isActive",
      "stockQuantity",
      "price",
      "compareAtPrice",
    ];
    const updateData: any = {};

    // Only include allowed fields in the update
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    // If there's nothing to update, return early
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const product = await db.product.update({
      where: {
        slug,
      },
      data: updateData,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
