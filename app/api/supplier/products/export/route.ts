import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function toCsvRow(values: Array<string | number | null | undefined>) {
  return values
    .map(v => {
      const s = v === null || v === undefined ? "" : String(v);
      const needsQuotes = /[",\n]/.test(s);
      const escaped = s.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    })
    .join(",");
}

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
    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt-desc";
    const lowStock = searchParams.get("lowStock") === "true";
    const lowStockThreshold = parseInt(
      searchParams.get("lowStockThreshold") || "5"
    );
    const minPrice = parseFloat(searchParams.get("minPrice") || "");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "");
    const tagsParam = searchParams.get("tags") || "";

    const where: any = { supplierId: supplier.id };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;
    if (category) where.categoryId = category;
    if (lowStock) where.stockQuantity = { lte: lowStockThreshold };
    if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
      where.price = {} as any;
      if (!Number.isNaN(minPrice)) (where.price as any).gte = minPrice;
      if (!Number.isNaN(maxPrice)) (where.price as any).lte = maxPrice;
    }
    if (tagsParam) {
      const tags = tagsParam
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);
      if (tags.length > 0) where.tags = { hasSome: tags } as any;
    }

    let orderBy: any = { createdAt: "desc" };
    if (sortBy) {
      const [field, direction] = sortBy.split("-");
      orderBy = { [field]: direction };
    }

    const products = await db.product.findMany({
      where,
      orderBy,
      include: {
        category: { select: { name: true } },
      },
    });

    const header = [
      "Name",
      "SKU",
      "Category",
      "Price",
      "CompareAt",
      "Active",
      "Stock",
      "ReorderPoint",
      "TotalSold",
      "CreatedAt",
    ];
    const rows = products.map(p =>
      toCsvRow([
        p.name,
        p.sku || "",
        p.category?.name || "",
        p.price,
        p.compareAtPrice ?? "",
        p.isActive ? "true" : "false",
        p.stockQuantity,
        p.reorderPoint ?? "",
        (p as any).totalSold ?? "",
        p.createdAt.toISOString(),
      ])
    );

    const csv = [toCsvRow(header), ...rows].join("\n");
    const response = new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="products-export.csv"`,
        "Cache-Control": "no-store",
      },
    });
    return response;
  } catch (error) {
    console.error("Error exporting supplier products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
