import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

type StockRequestItem = {
  productId: string;
  isBook?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { items?: StockRequestItem[] };
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({}, { status: 200 });
    }

    // For non-book items, fetch stock from DB
    const nonBookProductIds = Array.from(
      new Set(
        items
          .filter(i => !i.isBook && typeof i.productId === "string")
          .map(i => i.productId)
      )
    );

    let stocks: Record<string, number> = {};

    if (nonBookProductIds.length > 0) {
      const products = await db.product.findMany({
        where: { id: { in: nonBookProductIds } },
        select: { id: true, stockQuantity: true, reservedQuantity: true },
      });

      for (const p of products) {
        const available = Math.max(
          0,
          (p.stockQuantity ?? 0) - (p.reservedQuantity ?? 0)
        );
        stocks[p.id] = available;
      }
    }

    // For book items, assume effectively unlimited stock (no restriction)
    for (const item of items) {
      if (item.isBook) {
        // Use a large number instead of Infinity to keep JSON simple
        stocks[item.productId] = 999999;
      } else if (!(item.productId in stocks)) {
        // If product not found in DB, default to 0 to prevent overselling
        stocks[item.productId] = 0;
      }
    }

    return NextResponse.json(stocks, { status: 200 });
  } catch (error) {
    console.error("/api/products/stock error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export function GET() {
  // Method not allowed for GET
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
