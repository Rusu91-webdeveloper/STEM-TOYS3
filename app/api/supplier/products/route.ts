import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateCsrfForRequest } from "@/lib/csrf";

// Product creation schema
const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100),
  description: z.string().min(10).max(1000),
  price: z.number().min(0.01, "Price must be greater than 0"),
  compareAtPrice: z.number().optional(),
  sku: z.string().optional(),
  stockQuantity: z.number().min(0),
  reorderPoint: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  ageGroup: z
    .enum([
      "TODDLERS_1_3",
      "PRESCHOOL_3_5",
      "ELEMENTARY_6_8",
      "MIDDLE_SCHOOL_9_12",
      "TEENS_13_PLUS",
    ])
    .optional(),
  stemDiscipline: z
    .enum(["SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"])
    .default("GENERAL"),
  productType: z
    .enum([
      "ROBOTICS",
      "PUZZLES",
      "CONSTRUCTION_SETS",
      "EXPERIMENT_KITS",
      "BOARD_GAMES",
    ])
    .optional(),
  learningOutcomes: z
    .array(
      z.enum([
        "PROBLEM_SOLVING",
        "CREATIVITY",
        "CRITICAL_THINKING",
        "MOTOR_SKILLS",
        "LOGIC",
      ])
    )
    .default([]),
  specialCategories: z
    .array(z.enum(["NEW_ARRIVALS", "BEST_SELLERS", "GIFT_IDEAS", "SALE_ITEMS"]))
    .default([]),
  attributes: z.record(z.any()).optional(),
  images: z.array(z.string()).default([]),
});

// GET - List supplier products
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get supplier ID from session
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const lowStock = searchParams.get("lowStock") === "true";
    const lowStockThreshold = parseInt(
      searchParams.get("lowStockThreshold") || "5"
    );
    const category = searchParams.get("category") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt-desc";
    const minPrice = parseFloat(searchParams.get("minPrice") || "");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "");
    const tagsParam = searchParams.get("tags") || ""; // comma-separated

    // Build where clause
    const where: any = { supplierId: supplier.id };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    if (category) {
      where.categoryId = category;
    }

    // Low stock filter (based on numeric threshold)
    if (lowStock) {
      where.stockQuantity = { lte: lowStockThreshold };
    }

    // Price range filter
    if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
      where.price = {} as any;
      if (!Number.isNaN(minPrice)) (where.price as any).gte = minPrice;
      if (!Number.isNaN(maxPrice)) (where.price as any).lte = maxPrice;
    }

    // Tags filter (any match)
    if (tagsParam) {
      const tags = tagsParam
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);
      if (tags.length > 0) {
        where.tags = { hasSome: tags } as any;
      }
    }

    // Build order by clause
    let orderBy: any = { createdAt: "desc" };
    if (sortBy) {
      const [field, direction] = sortBy.split("-");
      // Allow sorting by computed/popular fields like totalSold
      orderBy = { [field]: direction };
    }

    // Fetch products with pagination
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching supplier products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get supplier ID from session
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // CSRF validation
    let csrfBody: any = null;
    try {
      const clone = request.clone();
      csrfBody = await clone.json();
    } catch {}
    const csrfResult = await validateCsrfForRequest(request, csrfBody);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "CSRF validation failed", message: csrfResult.error },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = csrfBody ?? (await request.json());
    const validatedData = createProductSchema.parse(body);

    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const existingProduct = await db.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "A product with this name already exists" },
        { status: 400 }
      );
    }

    // Create product
    const product = await db.product.create({
      data: {
        ...(validatedData as any),
        ageGroup: ((validatedData as any).ageGroup ?? null) as any,
        learningOutcomes: ((validatedData as any).learningOutcomes ??
          []) as any,
        specialCategories: ((validatedData as any).specialCategories ??
          []) as any,
        slug,
        supplierId: supplier.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating supplier product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
