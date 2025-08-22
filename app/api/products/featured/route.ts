import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");

    // Validate and parse limit parameter
    let limit = 6; // Default limit
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit)) {
        return NextResponse.json(
          { success: false, error: "Invalid limit parameter" },
          { status: 400 }
        );
      }
      if (parsedLimit < 1 || parsedLimit > 20) {
        return NextResponse.json(
          { success: false, error: "Limit must be between 1 and 20" },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // Fetch featured products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          featured: true,
          published: true,
        },
        include: {
          category: {
            select: {
              name: true,
            },
          },
          images: {
            select: {
              url: true,
            },
            take: 1, // Only get the first image for performance
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      }),
      prisma.product.count({
        where: {
          featured: true,
          published: true,
        },
      }),
    ]);

    // Transform the data for frontend consumption
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      stock: product.stock,
      category: product.category?.name || null,
      image: product.images[0]?.url || null,
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      featured: product.featured,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      total,
      limit,
      hasMore: total > limit,
    });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch featured products" },
      { status: 500 }
    );
  }
}
