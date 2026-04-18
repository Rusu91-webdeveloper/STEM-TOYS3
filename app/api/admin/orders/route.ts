import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { deriveAdminOrderWorkflowSummary } from "@/lib/admin/order-workflow-action";
import { getCached } from "@/lib/cache";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import { getCacheKey } from "@/lib/utils/cache-key";
import { getFilterParams } from "@/lib/utils/filtering";
import { getPaginationParams } from "@/lib/utils/pagination";

export const GET = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();

      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      // Use shared utilities for pagination and filtering
      const searchParams = request.nextUrl.searchParams;
      const { page, limit, skip } = getPaginationParams(searchParams, {
        defaultLimit: 10,
        maxLimit: 100,
      });
      const filters = getFilterParams(searchParams, [
        "status",
        "period",
        "search",
        "workflowBucket",
      ]);
      const workflowBucketFilter =
        filters.workflowBucket && filters.workflowBucket !== "all"
          ? String(filters.workflowBucket)
          : null;

      // Build where clause for filtering
      const where: any = {};

      if (filters.status && filters.status !== "all") {
        // Handle special shipping_review filter
        if (filters.status === "shipping_review") {
          where.manualShippingReviewRequired = true;
        } else {
          where.status = String(filters.status).toUpperCase();
        }
      }

      if (filters.period && filters.period !== "all") {
        const days = parseInt(String(filters.period));
        const date = new Date();
        date.setDate(date.getDate() - days);
        where.createdAt = {
          gte: date,
        };
      }

      if (filters.search) {
        where.OR = [
          {
            orderNumber: {
              contains: String(filters.search),
              mode: "insensitive",
            },
          },
          {
            user: {
              OR: [
                {
                  name: {
                    contains: String(filters.search),
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: String(filters.search),
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        ];
      }

      const orderQueryBase = {
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              isDigital: true,
            },
          },
          shipments: {
            where: { awbNumber: { not: null } },
            select: { awbNumber: true },
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
              totalCost: true,
              quantity: true,
              supplier: {
                select: {
                  name: true,
                  companyName: true,
                },
              },
              orderItem: {
                select: {
                  name: true,
                },
              },
              product: {
                select: {
                  sku: true,
                  images: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc" as const,
        },
      };

      let totalCount = 0;
      let formattedOrders: any[] = [];

      if (workflowBucketFilter) {
        const allOrders = await db.order.findMany(orderQueryBase);

        const mapped = allOrders.map(order => {
          const workflow = deriveAdminOrderWorkflowSummary({
            status: order.status,
            trackingNumber: order.trackingNumber,
            manualShippingReviewRequired: order.manualShippingReviewRequired,
            items: order.items,
            shipments: order.shipments,
            supplierOrders: order.supplierOrders,
          });
          return mapAdminOrderRow(order, workflow);
        });

        const filtered = mapped.filter(
          row => row.workflowBucket === workflowBucketFilter
        );
        totalCount = filtered.length;
        formattedOrders = filtered.slice(skip, skip + limit);
      } else {
        // Use shared cache key utility
        const cacheKey = getCacheKey("admin-orders", { ...filters, page, limit });
        const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

        // Get total count for pagination (not cached to ensure accuracy)
        totalCount = await db.order.count({ where });

        const orders = await getCached(
          cacheKey,
          () =>
            db.order.findMany({
              ...orderQueryBase,
              skip,
              take: limit,
            }),
          CACHE_TTL
        );

        formattedOrders = orders.map(order => {
          const workflow = deriveAdminOrderWorkflowSummary({
            status: order.status,
            trackingNumber: order.trackingNumber,
            manualShippingReviewRequired: order.manualShippingReviewRequired,
            items: order.items,
            shipments: order.shipments,
            supplierOrders: order.supplierOrders,
          });
          return mapAdminOrderRow(order, workflow);
        });
      }

      // Calculate pagination
      const totalPages = Math.ceil(totalCount / limit);
      const pagination = {
        total: totalCount,
        page,
        limit,
        pages: totalPages,
      };

      // Return formatted response that matches frontend expectations
      return NextResponse.json({
        orders: formattedOrders,
        pagination,
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to fetch admin orders", details: error },
        { status: 500 }
      );
    }
  },
  { limit: 30, windowMs: 10 * 60 * 1000 }
);

// Helper function to format order status for display
function formatStatus(status: string): string {
  // Convert from enum format (e.g., PROCESSING) to title case (e.g., Processing)
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function mapAdminOrderRow(order: any, workflow: any) {
  let dateStr = "N/A";
  if (order.createdAt) {
    const date = new Date(order.createdAt);
    if (!isNaN(date.getTime())) {
      dateStr = date.toISOString().split("T")[0];
    }
  }

  const supplierOrders = Array.isArray(order.supplierOrders)
    ? order.supplierOrders
    : [];
  const uniqueSupplierNames = Array.from(
    new Set(
      supplierOrders
        .map((supplierOrder: any) =>
          supplierOrder.supplier?.name || supplierOrder.supplier?.companyName
        )
        .filter(Boolean)
    )
  );
  const totalSupplierValue = supplierOrders.reduce(
    (sum: number, supplierOrder: any) =>
      sum + Number(supplierOrder.totalCost ?? 0),
    0
  );
  const trackedSupplierOrders = supplierOrders.filter(
    (supplierOrder: any) =>
      Boolean(supplierOrder.trackingNumber || supplierOrder.supplierOrderId)
  ).length;
  const supplierLinePreview = supplierOrders.slice(0, 3).map(
    (supplierOrder: any) => ({
      id: supplierOrder.id,
      supplierName:
        supplierOrder.supplier?.name ||
        supplierOrder.supplier?.companyName ||
        "Unknown Supplier",
      itemName: supplierOrder.orderItem?.name || "Unknown Item",
      sku: supplierOrder.product?.sku || null,
      quantity: Number(supplierOrder.quantity ?? 0),
      totalCost: Number(supplierOrder.totalCost ?? 0),
      status: supplierOrder.status || "PENDING",
      trackingNumber: supplierOrder.trackingNumber || null,
      imageUrl: supplierOrder.product?.images?.[0] || null,
    })
  );

  return {
    dbId: order.id,
    id: order.orderNumber ?? order.id,
    customer: order.user?.name ?? "Guest User",
    email: order.user?.email ?? "N/A",
    date: dateStr,
    total: Number(order.total ?? 0),
    status: formatStatus(order.status),
    payment: order.paymentMethod ?? "N/A",
    items: order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) ?? 0,
    manualShippingReviewRequired: order.manualShippingReviewRequired ?? false,
    shippingReviewReason: order.shippingReviewReason ?? null,
    workflowBucket: workflow.actionBucket,
    workflowLabel: workflow.actionLabel,
    fulfillmentStatus: workflow.fulfillmentStatus,
    supplierCount: uniqueSupplierNames.length,
    suppliers: uniqueSupplierNames,
    totalSupplierValue,
    trackedSupplierOrders,
    supplierLinePreview,
    trackingNumber: order.trackingNumber ?? null,
    shipmentCount: Array.isArray(order.shipments) ? order.shipments.length : 0,
  };
}

// After any admin order mutation (POST, PUT, DELETE), add:
// await invalidateCachePattern('order:');
// await invalidateCachePattern('orders:');
