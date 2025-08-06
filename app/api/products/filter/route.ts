import {
  AgeGroup,
  LearningOutcome,
  ProductType,
  SpecialCategory,
  StemCategory,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract filter parameters
    const ageGroup = searchParams.get("ageGroup") as AgeGroup | null;
    const stemDiscipline = searchParams.get(
      "stemDiscipline"
    ) as StemCategory | null;
    const learningOutcomes = searchParams
      .get("learningOutcomes")
      ?.split(",") as LearningOutcome[] | null;
    const productType = searchParams.get("productType") as ProductType | null;
    const specialCategories = searchParams
      .get("specialCategories")
      ?.split(",") as SpecialCategory[] | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (ageGroup) {
      where.ageGroup = ageGroup;
    }

    if (stemDiscipline) {
      where.stemDiscipline = stemDiscipline;
    }

    if (learningOutcomes && learningOutcomes.length > 0) {
      where.learningOutcomes = {
        hasSome: learningOutcomes,
      };
    }

    if (productType) {
      where.productType = productType;
    }

    if (specialCategories && specialCategories.length > 0) {
      where.specialCategories = {
        hasSome: specialCategories,
      };
    }

    // Execute query
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average ratings
    const productsWithRatings = products.map(product => {
      const totalRating = product.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating =
        product.reviews.length > 0 ? totalRating / product.reviews.length : 0;

      return {
        ...product,
        averageRating,
        reviewCount: product.reviews.length,
        reviews: undefined, // Remove reviews from response
      };
    });

    return NextResponse.json({
      products: productsWithRatings,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: {
        ageGroup,
        stemDiscipline,
        learningOutcomes,
        productType,
        specialCategories,
      },
    });
  } catch (error) {
    console.error("Error filtering products:", error);
    return NextResponse.json(
      { error: "Failed to filter products" },
      { status: 500 }
    );
  }
}
