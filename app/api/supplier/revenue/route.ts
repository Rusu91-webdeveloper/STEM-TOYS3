import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!supplier)
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );

    // Get time range parameter
    const timeRange = request.nextUrl.searchParams.get("period") || "1y";
    const { startDate, endDate } = getDateRange(timeRange);

    const orders = await db.supplierOrder.findMany({
      where: {
        supplierId: supplier.id,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        supplierRevenue: true,
        commission: true,
        quantity: true,
        order: {
          select: {
            userId: true,
          },
        },
      },
    });

    // Aggregate by month (YYYY-MM)
    const seriesMap = new Map<
      string,
      {
        revenue: number;
        commission: number;
        orders: number;
        customers: Set<string>;
      }
    >();

    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      seriesMap.set(key, {
        revenue: 0,
        commission: 0,
        orders: 0,
        customers: new Set(),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    for (const o of orders) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = seriesMap.get(key);
      if (entry) {
        entry.revenue += o.supplierRevenue || 0;
        entry.commission += o.commission || 0;
        entry.orders += o.quantity || 0;
        if (o.order?.userId) {
          entry.customers.add(o.order.userId);
        }
      }
    }

    const series = Array.from(seriesMap.entries()).map(([month, v]) => ({
      month,
      revenue: Number(v.revenue.toFixed(2)),
      commission: Number(v.commission.toFixed(2)),
      orders: v.orders,
      customers: v.customers.size,
    }));

    return NextResponse.json({ series });
  } catch (error) {
    console.error("Error fetching revenue series:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 90);
      break;
    case "1y":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setFullYear(startDate.getFullYear() - 1);
  }

  return { startDate, endDate };
}
