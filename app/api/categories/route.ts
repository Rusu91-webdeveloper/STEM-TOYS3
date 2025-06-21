import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get all categories
    const categories = await db.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    // Transform the response to include product counts
    const categoriesWithCounts = categories.map((category) => ({
      ...category,
      productCount: category._count.products,
      _count: undefined,
    }));

    return NextResponse.json(categoriesWithCounts, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
