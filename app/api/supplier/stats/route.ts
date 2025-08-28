import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Aggregated supplier stats for analytics dashboards
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
      select: { id: true, commissionRate: true },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Define useful time ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Period parameter for time-series (default 30 days)
    const period = parseInt(request.nextUrl.searchParams.get("period") || "30");
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Parallelize queries for performance
    const [
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      revenueAllTimeAgg,
      revenueThisMonthAgg,
      pendingInvoicesCount,
      revenueSeries,
    ] = await Promise.all([
      db.product.count({ where: { supplierId: supplier.id } }),
      db.product.count({ where: { supplierId: supplier.id, isActive: true } }),
      db.supplierOrder.count({ where: { supplierId: supplier.id } }),
      db.supplierOrder.count({
        where: { supplierId: supplier.id, status: "PENDING" },
      }),
      db.supplierOrder.aggregate({
        _sum: { supplierRevenue: true, commission: true },
        where: { supplierId: supplier.id },
      }),
      db.supplierOrder.aggregate({
        _sum: { supplierRevenue: true },
        where: { supplierId: supplier.id, createdAt: { gte: startOfMonth } },
      }),
      db.supplierInvoice.count({
        where: {
          supplierId: supplier.id,
          status: { in: ["DRAFT", "SENT", "OVERDUE"] },
        },
      }),
      getRevenueSeriesForSupplier(supplier.id, startDate, endDate),
    ]);

    const totalRevenue = revenueAllTimeAgg._sum.supplierRevenue ?? 0;
    const monthlyRevenue = revenueThisMonthAgg._sum.supplierRevenue ?? 0;
    const commissionEarned = revenueAllTimeAgg._sum.commission ?? 0;

    return NextResponse.json({
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      monthlyRevenue,
      commissionEarned,
      pendingInvoices: pendingInvoicesCount,
      revenueSeries,
    });
  } catch (error) {
    console.error("Error fetching supplier stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getRevenueSeriesForSupplier(
  supplierId: string,
  startDate: Date,
  endDate: Date
) {
  // Build list of days
  const days: Date[] = [];
  const d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  while (d <= endDate) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  const orders = await db.supplierOrder.findMany({
    where: {
      supplierId,
      createdAt: { gte: startDate, lte: endDate },
      status: {
        in: [
          "CONFIRMED",
          "IN_PRODUCTION",
          "READY_TO_SHIP",
          "SHIPPED",
          "DELIVERED",
        ],
      },
    },
    select: { createdAt: true, supplierRevenue: true },
  });

  return days.map(day => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const dayTotal = orders
      .filter(o => o.createdAt >= dayStart && o.createdAt <= dayEnd)
      .reduce((sum, o) => sum + (o.supplierRevenue || 0), 0);

    return {
      date: day.toISOString().split("T")[0],
      revenue: Number(dayTotal.toFixed(2)),
    };
  });
}
