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

    const end = new Date();
    const start = new Date(end);
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);

    const orders = await db.supplierOrder.findMany({
      where: { supplierId: supplier.id, createdAt: { gte: start, lte: end } },
      select: { createdAt: true, supplierRevenue: true, commission: true },
    });

    // Aggregate by month (YYYY-MM)
    const seriesMap = new Map<
      string,
      { revenue: number; commission: number }
    >();
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      seriesMap.set(key, { revenue: 0, commission: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    for (const o of orders) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = seriesMap.get(key);
      if (entry) {
        entry.revenue += o.supplierRevenue || 0;
        entry.commission += o.commission || 0;
      }
    }

    const series = Array.from(seriesMap.entries()).map(([month, v]) => ({
      month,
      revenue: Number(v.revenue.toFixed(2)),
      commission: Number(v.commission.toFixed(2)),
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
