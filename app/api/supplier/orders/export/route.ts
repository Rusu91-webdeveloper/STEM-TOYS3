import { NextRequest, NextResponse } from "next/server";
import { withSupplierAuth } from "@/lib/authorization";
import { getCurrentSupplier } from "@/lib/supplier-auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const GET = withSupplierAuth(async (request: NextRequest, session) => {
  try {
    const supplier = await getCurrentSupplier(session);
    
    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier profile not found" },
        { status: 404 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const period = searchParams.get("period") || "";

    // Build where clause
    const where: any = { supplierId: supplier.id };
    
    if (status && status !== "ALL") {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        {
          order: {
            orderNumber: { contains: search, mode: "insensitive" }
          }
        },
        {
          product: {
            name: { contains: search, mode: "insensitive" }
          }
        }
      ];
    }
    
    if (period && period !== "ALL") {
      const days = parseInt(period);
      const date = new Date();
      date.setDate(date.getDate() - days);
      where.createdAt = { gte: date };
    }

    // Get all orders for export
    const orders = await db.supplierOrder.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              }
            },
            shippingAddress: {
              select: {
                fullName: true,
                addressLine1: true,
                city: true,
                state: true,
                postalCode: true,
                country: true,
                phone: true,
              }
            }
          }
        },
        product: {
          select: {
            name: true,
            sku: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV content
    const csvHeaders = [
      "Order Number",
      "Product Name",
      "SKU",
      "Quantity",
      "Unit Price",
      "Total Price",
      "Supplier Revenue",
      "Commission",
      "Status",
      "Customer Name",
      "Customer Email",
      "Shipping Address",
      "Phone",
      "Order Date",
      "Payment Status",
      "Tracking Number",
      "Notes"
    ];

    const csvRows = orders.map(order => [
      order.order.orderNumber,
      order.product.name,
      order.product.sku || "",
      order.quantity,
      order.unitPrice.toFixed(2),
      order.totalPrice.toFixed(2),
      order.supplierRevenue.toFixed(2),
      order.commission.toFixed(2),
      order.status,
      order.order.user.name,
      order.order.user.email,
      `${order.order.shippingAddress.addressLine1}, ${order.order.shippingAddress.city}, ${order.order.shippingAddress.state} ${order.order.shippingAddress.postalCode}, ${order.order.shippingAddress.country}`,
      order.order.shippingAddress.phone,
      new Date(order.createdAt).toLocaleDateString("ro-RO"),
      order.order.paymentStatus,
      order.trackingNumber || "",
      order.notes || ""
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    logger.info("Supplier orders exported successfully", {
      supplierId: supplier.id,
      count: orders.length,
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    logger.error("Error exporting supplier orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
