import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSupplierDashboardData } from "@/lib/supplier-auth";

export async function GET() {
  const session = await auth();
  const data = await getSupplierDashboardData();

  if (!data) {
    return NextResponse.json(
      { error: "Unauthorized or no data" },
      { status: 401 }
    );
  }

  // For VISITOR users, return demo data instead of real data
  if (session?.user?.role === "VISITOR") {
    return NextResponse.json(generateDemoData());
  }

  // Compute additional stats accurately from DB for real suppliers
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

/**
 * Generate realistic demo data for VISITOR users
 * This shows what the dashboard would look like with actual business data
 */
function generateDemoData() {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    supplier: {
      businessCountry: "Romania",
    },
    stats: {
      totalProducts: 24,
      activeProducts: 22,
      totalOrders: 156,
      pendingOrders: 8,
      totalRevenue: 45680.5,
      monthlyRevenue: 12340.75,
      commissionEarned: 2340.25,
      pendingInvoices: 3,
    },
    recentOrders: [
      {
        id: "demo-order-1",
        supplierId: "demo-supplier",
        orderId: "ORD-2024-001234",
        orderItemId: "item-1",
        productId: "prod-1",
        quantity: 2,
        unitPrice: 89.99,
        totalPrice: 179.98,
        commission: 18.0,
        supplierRevenue: 161.98,
        status: "DELIVERED",
        createdAt: new Date(
          now.getTime() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updatedAt: new Date(
          now.getTime() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
        trackingNumber: "RO123456789",
        shippedAt: new Date(
          now.getTime() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: "demo-order-2",
        supplierId: "demo-supplier",
        orderId: "ORD-2024-001235",
        orderItemId: "item-2",
        productId: "prod-2",
        quantity: 1,
        unitPrice: 149.99,
        totalPrice: 149.99,
        commission: 15.0,
        supplierRevenue: 134.99,
        status: "SHIPPED",
        createdAt: new Date(
          now.getTime() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updatedAt: new Date(
          now.getTime() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
        trackingNumber: "RO987654321",
        shippedAt: new Date(
          now.getTime() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: "demo-order-3",
        supplierId: "demo-supplier",
        orderId: "ORD-2024-001236",
        orderItemId: "item-3",
        productId: "prod-3",
        quantity: 3,
        unitPrice: 79.99,
        totalPrice: 239.97,
        commission: 24.0,
        supplierRevenue: 215.97,
        status: "CONFIRMED",
        createdAt: new Date(
          now.getTime() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updatedAt: new Date(
          now.getTime() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
        trackingNumber: null,
        shippedAt: null,
      },
      {
        id: "demo-order-4",
        supplierId: "demo-supplier",
        orderId: "ORD-2024-001237",
        orderItemId: "item-4",
        productId: "prod-4",
        quantity: 1,
        unitPrice: 199.99,
        totalPrice: 199.99,
        commission: 20.0,
        supplierRevenue: 179.99,
        status: "PENDING",
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        trackingNumber: null,
        shippedAt: null,
      },
      {
        id: "demo-order-5",
        supplierId: "demo-supplier",
        orderId: "ORD-2024-001238",
        orderItemId: "item-5",
        productId: "prod-5",
        quantity: 2,
        unitPrice: 59.99,
        totalPrice: 119.98,
        commission: 12.0,
        supplierRevenue: 107.98,
        status: "DELIVERED",
        createdAt: new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updatedAt: new Date(
          now.getTime() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
        trackingNumber: "RO456789123",
        shippedAt: new Date(
          now.getTime() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    ],
    notifications: [
      {
        id: "demo-notif-1",
        type: "order" as const,
        title: "New Order Received",
        message:
          "Order #ORD-2024-001237 has been placed for your Robotics Coding Starter Kit",
        date: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        read: false,
      },
      {
        id: "demo-notif-2",
        type: "payment" as const,
        title: "Payment Processed",
        message:
          "Payment of €179.98 for Order #ORD-2024-001234 has been processed",
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        read: false,
      },
      {
        id: "demo-notif-3",
        type: "system" as const,
        title: "Monthly Report Available",
        message:
          "Your January 2024 performance report is now available in Analytics",
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
      },
      {
        id: "demo-notif-4",
        type: "order" as const,
        title: "Order Shipped",
        message:
          "Order #ORD-2024-001235 has been shipped with tracking number RO987654321",
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
      },
    ],
  };
}
