import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getSupplierDashboardData } from "@/lib/supplier-auth";

export async function GET() {
  const data = await getSupplierDashboardData();
  if (!data) {
    return NextResponse.json(
      { error: "Unauthorized or no data" },
      { status: 401 }
    );
  }

  // Compute additional stats accurately from DB
  const supplierId = data.supplier.id;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    activeProducts,
    pendingOrders,
    monthlyRevenueAgg,
    commissionAgg,
    pendingInvoices,
  ] = await Promise.all([
    db.product.count({ where: { supplierId, isActive: true } }),
    db.supplierOrder.count({
      where: {
        supplierId,
        status: {
          in: ["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP"],
        },
      },
    }),
    db.supplierOrder.aggregate({
      where: {
        supplierId,
        createdAt: { gte: startOfMonth },
        status: {
          in: ["DELIVERED", "SHIPPED", "READY_TO_SHIP", "CONFIRMED", "PENDING"],
        },
      },
      _sum: { supplierRevenue: true },
    }),
    db.supplierOrder.aggregate({
      where: { supplierId, status: { in: ["DELIVERED"] } },
      _sum: { commission: true },
    }),
    db.supplierInvoice.count({
      where: { supplierId, status: { in: ["SENT", "OVERDUE"] } },
    }),
  ]);

  // Normalize payload for the dashboard UI
  const payload = {
    supplier: {
      businessCountry: data.supplier.businessCountry || "",
    },
    stats: {
      totalProducts: data.stats.productCount || 0,
      activeProducts,
      totalOrders: data.stats.orderCount || 0,
      pendingOrders,
      totalRevenue: Number(data.stats.totalRevenue) || 0,
      monthlyRevenue: Number(monthlyRevenueAgg._sum.supplierRevenue ?? 0),
      commissionEarned: Number(commissionAgg._sum.commission ?? 0),
      pendingInvoices,
    },
    recentOrders: data.recentOrders.map(o => ({
      id: o.id,
      supplierId: o.supplierId,
      orderId: o.orderId,
      orderItemId: o.orderItemId,
      productId: o.productId,
      quantity: o.quantity,
      unitPrice: Number(o.unitPrice ?? 0),
      totalPrice: Number(o.totalPrice ?? 0),
      commission: Number(o.commission ?? 0),
      supplierRevenue: Number(o.supplierRevenue ?? 0),
      status: o.status,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      trackingNumber: (o as any).trackingNumber,
      shippedAt: (o as any).shippedAt,
    })),
    notifications: [],
  };

  return NextResponse.json(payload);
}
