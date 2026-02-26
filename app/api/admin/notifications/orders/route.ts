import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { deriveAdminOrderWorkflowSummary } from "@/lib/admin/order-workflow-action";
import { db } from "@/lib/db";

type AllowedRole = "ADMIN" | "VISITOR";

const isAdminLikeRole = (role?: string | null): role is AllowedRole =>
  role === "ADMIN" || role === "VISITOR";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !isAdminLikeRole(session.user.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const rawLimit = Number(request.nextUrl.searchParams.get("limit") || "10");
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.trunc(rawLimit), 1), 30)
      : 10;

    const orders = await db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        trackingNumber: true,
        total: true,
        createdAt: true,
        manualShippingReviewRequired: true,
        shippingReviewReason: true,
        items: {
          select: {
            isDigital: true,
          },
        },
        shipments: {
          where: { awbNumber: { not: null } },
          select: {
            awbNumber: true,
          },
          take: 3,
        },
        supplierOrders: {
          select: {
            id: true,
            status: true,
            trackingNumber: true,
            supplierOrderId: true,
            supplierId: true,
            shippedAt: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        shippingAddress: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const notifications = orders.map(order => {
      const workflow = deriveAdminOrderWorkflowSummary({
        status: order.status,
        trackingNumber: order.trackingNumber,
        manualShippingReviewRequired: order.manualShippingReviewRequired,
        items: order.items,
        shipments: order.shipments,
        supplierOrders: order.supplierOrders,
      });

      return {
        id: order.id,
        orderNumber: order.orderNumber || order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        total: Number(order.total ?? 0),
        createdAt: order.createdAt.toISOString(),
        manualShippingReviewRequired: order.manualShippingReviewRequired ?? false,
        shippingReviewReason: order.shippingReviewReason ?? null,
        customerName:
          order.user?.name || order.shippingAddress?.fullName || "Guest",
        customerEmail: order.user?.email || null,
        supplierOrderCount: workflow.supplierOrderCount,
        hasPhysicalItems: workflow.hasPhysicalItems,
        hasTracking: workflow.hasTracking,
        fulfillmentStatus: workflow.fulfillmentStatus,
        actionBucket: workflow.actionBucket,
        actionLabel: workflow.actionLabel,
      };
    });

    return NextResponse.json({
      notifications,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching admin order notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
