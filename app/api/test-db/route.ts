import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET() {
  try {
    // Test basic database connectivity
    const userCount = await db.user.count();
    const categoryCount = await db.category.count();
    const productCount = await db.product.count();

    // Get sample data
    const categories = await db.category.findMany({
      select: { id: true, name: true, slug: true },
    });

    const products = await db.product.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        price: true,
        isActive: true,
      },
    });

    const dbInfo = {
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        counts: {
          users: userCount,
          categories: categoryCount,
          products: productCount,
        },
      },
      sampleData: {
        categories,
        products,
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_START: `${process.env.DATABASE_URL?.substring(0, 30)}...`,
      },
    };

    return NextResponse.json(dbInfo, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          hasDATABASE_URL: !!process.env.DATABASE_URL,
          DATABASE_URL_START: `${process.env.DATABASE_URL?.substring(0, 30)}...`,
        },
      },
      { status: 500 }
    );
  }
}
