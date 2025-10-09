import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json(
        { error: "Unauthorized - Supplier authentication required" },
        { status: 401 }
      );
    }

    // Get supplier from session
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Get total and active products count
    const [totalProducts, activeProducts] = await Promise.all([
      db.product.count({
        where: { supplierId: supplier.id },
      }),
      db.product.count({
        where: {
          supplierId: supplier.id,
          isActive: true,
        },
      }),
    ]);

    // Get total sales (sum of totalSold field)
    const salesData = await db.product.aggregate({
      where: { supplierId: supplier.id },
      _sum: {
        totalSold: true,
      },
    });

    // Get low stock count (products where stockQuantity <= reorderPoint)
    const lowStockCount = await db.product.count({
      where: {
        supplierId: supplier.id,
        stockQuantity: { lte: 5 }, // Simple check: stock <= 5
      },
    });

    // Get monthly revenue (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const ordersThisMonth = await db.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: startOfMonth },
          status: {
            in: ["PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"],
          },
        },
        product: {
          supplierId: supplier.id,
        },
      },
      include: {
        product: true,
      },
    });

    const monthlyRevenue = ordersThisMonth.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    return NextResponse.json({
      totalProducts,
      activeProducts,
      totalSales: salesData._sum.totalSold || 0,
      lowStockCount,
      monthlyRevenue,
    });
  } catch (error) {
    console.error("Error fetching supplier product metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch product metrics" },
      { status: 500 }
    );
  }
}
