import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        companyName: true,
        contactPersonName: true,
        commissionRate: true,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { timeRange = "30d", includeCharts = true } = body;

    // Get analytics data
    const { startDate, endDate } = getDateRange(timeRange);

    const [stats, revenueSeries, performanceMetrics] = await Promise.all([
      getSupplierStats(supplier.id, startDate, endDate),
      getRevenueSeries(supplier.id, startDate, endDate),
      getPerformanceMetrics(supplier.id, startDate, endDate),
    ]);

    // Generate PDF report
    const pdfBytes = await generateAnalyticsReport({
      supplier,
      stats,
      revenueSeries,
      performanceMetrics,
      timeRange,
      includeCharts,
    });

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="supplier-analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating analytics report:", error);
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
      startDate.setDate(startDate.getDate() - 30);
  }

  return { startDate, endDate };
}

async function getSupplierStats(
  supplierId: string,
  startDate: Date,
  endDate: Date
) {
  const [
    totalProducts,
    activeProducts,
    totalOrders,
    pendingOrders,
    revenueAgg,
    commissionAgg,
  ] = await Promise.all([
    db.product.count({ where: { supplierId } }),
    db.product.count({ where: { supplierId, isActive: true } }),
    db.supplierOrder.count({
      where: {
        supplierId,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    db.supplierOrder.count({
      where: {
        supplierId,
        status: "PENDING",
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    db.supplierOrder.aggregate({
      _sum: { supplierRevenue: true },
      where: {
        supplierId,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    db.supplierOrder.aggregate({
      _sum: { commission: true },
      where: {
        supplierId,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  return {
    totalProducts,
    activeProducts,
    totalOrders,
    pendingOrders,
    totalRevenue: revenueAgg._sum.supplierRevenue || 0,
    commissionEarned: commissionAgg._sum.commission || 0,
  };
}

async function getRevenueSeries(
  supplierId: string,
  startDate: Date,
  endDate: Date
) {
  const orders = await db.supplierOrder.findMany({
    where: {
      supplierId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      createdAt: true,
      supplierRevenue: true,
      commission: true,
    },
  });

  // Group by month
  const seriesMap = new Map<string, { revenue: number; commission: number }>();
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
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

  return Array.from(seriesMap.entries()).map(([month, v]) => ({
    month,
    revenue: Number(v.revenue.toFixed(2)),
    commission: Number(v.commission.toFixed(2)),
  }));
}

async function getPerformanceMetrics(
  supplierId: string,
  startDate: Date,
  endDate: Date
) {
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
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  });

  const totalRevenue = orders.reduce(
    (sum, o) => sum + (o.supplierRevenue || 0),
    0
  );
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Get top products
  const productStats = new Map<
    string,
    { name: string; sales: number; revenue: number }
  >();
  orders.forEach(order => {
    const productId = order.productId;
    const existing = productStats.get(productId) || {
      name: order.product?.name || "Unknown",
      sales: 0,
      revenue: 0,
    };
    productStats.set(productId, {
      name: existing.name,
      sales: existing.sales + (order.quantity || 0),
      revenue: existing.revenue + (order.supplierRevenue || 0),
    });
  });

  const topProducts = Array.from(productStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    averageOrderValue,
    topProducts,
  };
}

async function generateAnalyticsReport({
  supplier,
  stats,
  revenueSeries,
  performanceMetrics,
  timeRange,
  includeCharts,
}: {
  supplier: any;
  stats: any;
  revenueSeries: any[];
  performanceMetrics: any;
  timeRange: string;
  includeCharts: boolean;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let yPosition = height - 50;

  // Header
  page.drawText("TechTots Supplier Analytics Report", {
    x: 50,
    y: yPosition,
    size: 24,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  yPosition -= 30;

  page.drawText(`Generated for: ${supplier.companyName}`, {
    x: 50,
    y: yPosition,
    size: 14,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  yPosition -= 20;

  page.drawText(
    `Period: ${timeRange} | Generated: ${new Date().toLocaleDateString()}`,
    {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    }
  );

  yPosition -= 40;

  // Key Metrics Section
  page.drawText("Key Performance Metrics", {
    x: 50,
    y: yPosition,
    size: 18,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  yPosition -= 30;

  const metrics = [
    {
      label: "Total Revenue",
      value: `€${stats.totalRevenue.toLocaleString()}`,
    },
    {
      label: "Commission Earned",
      value: `€${stats.commissionEarned.toLocaleString()}`,
    },
    { label: "Total Orders", value: stats.totalOrders.toString() },
    { label: "Pending Orders", value: stats.pendingOrders.toString() },
    {
      label: "Active Products",
      value: `${stats.activeProducts}/${stats.totalProducts}`,
    },
    {
      label: "Average Order Value",
      value: `€${performanceMetrics.averageOrderValue.toFixed(2)}`,
    },
  ];

  let xPosition = 50;
  let col = 0;

  metrics.forEach((metric, index) => {
    if (col === 2) {
      col = 0;
      xPosition = 50;
      yPosition -= 40;
    }

    page.drawText(metric.label, {
      x: xPosition,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText(metric.value, {
      x: xPosition,
      y: yPosition - 15,
      size: 14,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    col++;
    xPosition += 200;
  });

  yPosition -= 60;

  // Revenue Series
  if (revenueSeries.length > 0) {
    page.drawText("Revenue by Month", {
      x: 50,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    yPosition -= 25;

    // Table header
    page.drawText("Month", { x: 50, y: yPosition, size: 12, font: boldFont });
    page.drawText("Revenue", {
      x: 150,
      y: yPosition,
      size: 12,
      font: boldFont,
    });
    page.drawText("Commission", {
      x: 250,
      y: yPosition,
      size: 12,
      font: boldFont,
    });

    yPosition -= 20;

    revenueSeries.forEach(item => {
      if (yPosition < 100) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }

      page.drawText(item.month, { x: 50, y: yPosition, size: 10, font: font });
      page.drawText(`€${item.revenue.toLocaleString()}`, {
        x: 150,
        y: yPosition,
        size: 10,
        font: font,
      });
      page.drawText(`€${item.commission.toLocaleString()}`, {
        x: 250,
        y: yPosition,
        size: 10,
        font: font,
      });

      yPosition -= 15;
    });

    yPosition -= 30;
  }

  // Top Products
  if (performanceMetrics.topProducts.length > 0) {
    page.drawText("Top Performing Products", {
      x: 50,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    yPosition -= 25;

    // Table header
    page.drawText("Product", { x: 50, y: yPosition, size: 12, font: boldFont });
    page.drawText("Sales", { x: 300, y: yPosition, size: 12, font: boldFont });
    page.drawText("Revenue", {
      x: 400,
      y: yPosition,
      size: 12,
      font: boldFont,
    });

    yPosition -= 20;

    performanceMetrics.topProducts.forEach(product => {
      if (yPosition < 100) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }

      const productName =
        product.name.length > 30
          ? product.name.substring(0, 30) + "..."
          : product.name;

      page.drawText(productName, { x: 50, y: yPosition, size: 10, font: font });
      page.drawText(product.sales.toString(), {
        x: 300,
        y: yPosition,
        size: 10,
        font: font,
      });
      page.drawText(`€${product.revenue.toLocaleString()}`, {
        x: 400,
        y: yPosition,
        size: 10,
        font: font,
      });

      yPosition -= 15;
    });
  }

  // Footer
  const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
  lastPage.drawText("TechTots STEM Toys - Supplier Analytics Report", {
    x: 50,
    y: 30,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await pdfDoc.save();
}
