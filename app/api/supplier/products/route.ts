import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { validateCsrfForRequest } from "@/lib/csrf";
import { db } from "@/lib/db";

// Enhanced product creation schema with better validation
const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name must be 100 characters or less")
    .refine(name => name.trim().length > 0, "Product name cannot be empty"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be 1000 characters or less")
    .refine(
      desc => desc.trim().length >= 10,
      "Description must be at least 10 characters"
    ),
  price: z
    .number()
    .min(0.01, "Price must be greater than 0")
    .max(999999.99, "Price cannot exceed 999,999.99"),
  priceCurrency: z.enum(["EUR", "RON"]).default("RON"),
  compareAtPrice: z
    .number()
    .min(0.01, "Compare at price must be greater than 0")
    .max(999999.99, "Compare at price cannot exceed 999,999.99")
    .optional(),
  compareAtPriceCurrency: z.enum(["EUR", "RON"]).default("RON").optional(),
  sku: z
    .string()
    .max(50, "SKU must be 50 characters or less")
    .optional()
    .refine(
      sku => !sku || sku.trim().length > 0,
      "SKU cannot be empty if provided"
    ),
  stockQuantity: z
    .number()
    .int("Stock quantity must be a whole number")
    .min(0, "Stock quantity cannot be negative")
    .max(999999, "Stock quantity cannot exceed 999,999"),
  reorderPoint: z
    .number()
    .int("Reorder point must be a whole number")
    .min(0, "Reorder point cannot be negative")
    .max(999999, "Reorder point cannot exceed 999,999")
    .optional(),
  weight: z
    .number()
    .min(0, "Weight cannot be negative")
    .max(999.99, "Weight cannot exceed 999.99 kg")
    .optional(),
  categoryId: z.string().optional(),
  tags: z
    .array(z.string())
    .max(20, "Cannot have more than 20 tags")
    .default([])
    .refine(
      tags => tags.every(tag => tag.trim().length > 0),
      "Tags cannot be empty"
    ),
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
    .max(5, "Cannot have more than 5 learning outcomes")
    .default([]),
  specialCategories: z
    .array(z.enum(["NEW_ARRIVALS", "BEST_SELLERS", "GIFT_IDEAS", "SALE_ITEMS"]))
    .max(4, "Cannot have more than 4 special categories")
    .default([]),
  attributes: z.record(z.any()).optional(),
  images: z
    .array(z.string())
    .max(10, "Cannot have more than 10 images")
    .default([])
    .refine(
      images =>
        images.every(
          img =>
            // Accept HTTP URLs, blob URLs, and placeholder URLs
            img.startsWith("http") ||
            img.startsWith("blob:") ||
            img.startsWith("placeholder://")
        ),
      "All images must be valid URLs, blob URLs, or placeholder URLs"
    ),
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

    // Block VISITOR role from write operations
    if (session?.user?.role === "VISITOR") {
      return NextResponse.json(
        {
          error: "Demo Mode - Read Only Access",
          message:
            "This is a demonstration account. Write operations are disabled.",
          isDemo: true,
        },
        { status: 403 }
      );
    }

    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json(
        {
          error: "Not authorized",
          message: "You must be logged in as a supplier to create products",
        },
        { status: 403 }
      );
    }

    // Get supplier ID from session
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        {
          error: "Supplier not found",
          message: "Your supplier account could not be found",
        },
        { status: 404 }
      );
    }

    // Check if supplier is approved
    if (supplier.status !== "APPROVED") {
      return NextResponse.json(
        {
          error: "Account not approved",
          message:
            "Your supplier account must be approved before creating products",
        },
        { status: 403 }
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

    // Process images - convert blob URLs and placeholders to proper URLs
    const processedImages = validatedData.images.map(img => {
      if (img.startsWith("blob:")) {
        // Handle legacy blob URLs
        return `https://via.placeholder.com/400x400?text=Image+Upload+Required`;
      }

      if (img.startsWith("placeholder://")) {
        // Handle new placeholder format
        try {
          const url = new URL(img);
          const fileName = url.hostname;
          const params = new URLSearchParams(url.search);
          const size = params.get("size");
          const type = params.get("type");

          // Create a more informative placeholder
          return `https://via.placeholder.com/400x400?text=${encodeURIComponent(fileName)}&size=${size || "unknown"}`;
        } catch (error) {
          console.warn("[SUPPLIER PRODUCT API] Invalid placeholder URL:", img);
          return `https://via.placeholder.com/400x400?text=Invalid+Image`;
        }
      }

      // Keep valid HTTP URLs as-is (including UploadThing URLs)
      if (img.startsWith("http")) {
        return img;
      }

      // Fallback for any other format
      console.warn("[SUPPLIER PRODUCT API] Unknown image format:", img);
      return `https://via.placeholder.com/400x400?text=Unknown+Format`;
    });

    console.log(
      "[SUPPLIER PRODUCT API] Creating product with processed images:",
      {
        originalCount: validatedData.images.length,
        processedCount: processedImages.length,
        originalImages: validatedData.images,
        processedImages,
      }
    );

    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const existingProduct = await db.product.findFirst({
      where: {
        OR: [{ slug }, { name: validatedData.name, supplierId: supplier.id }],
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          error: "Product already exists",
          message:
            existingProduct.slug === slug
              ? "A product with this name already exists"
              : "A product with this name already exists in your catalog",
        },
        { status: 400 }
      );
    }

    // Check if SKU already exists for this supplier
    if (validatedData.sku) {
      const existingSku = await db.product.findFirst({
        where: {
          sku: validatedData.sku,
          supplierId: supplier.id, // Only check within the same supplier
        },
      });

      if (existingSku) {
        return NextResponse.json(
          {
            error: "SKU already exists",
            message: `A product with SKU "${validatedData.sku}" already exists in your catalog. SKUs must be unique within your supplier account.`,
          },
          { status: 400 }
        );
      }
    }

    // Create product
    const {
      categoryId: createCategoryId,
      sku: createSku,
      price: inputPrice,
      priceCurrency: inputCurrency,
      compareAtPrice: inputComparePrice,
      compareAtPriceCurrency: inputCompareCurrency,
      // Exclude fields that go into metadata
      learningOutcomes,
      specialCategories,
      productType,
      ...restValidated
    } = (validatedData as any) || {};

    const normalizedSku =
      typeof createSku === "string" && createSku.trim() === ""
        ? undefined
        : createSku;

    // Convert prices to RON for storage
    const finalPrice = inputCurrency === "EUR" ? inputPrice * 5 : inputPrice;
    const finalComparePrice =
      inputComparePrice && inputCompareCurrency === "EUR"
        ? inputComparePrice * 5
        : inputComparePrice;

    // Prepare metadata with fields that don't exist in schema
    const productMetadata = {
      ...(restValidated.metadata || {}),
      learningOutcomes: (validatedData as any).learningOutcomes ?? [],
      specialCategories: (validatedData as any).specialCategories ?? [],
      productType: (validatedData as any).productType,
      priceCurrency: inputCurrency || "RON",
      compareAtPriceCurrency: inputCompareCurrency || "RON",
    };

    const product = await db.product.create({
      data: {
        ...(restValidated as any),
        price: finalPrice, // Always store in RON
        compareAtPrice: finalComparePrice, // Always store in RON
        ...(normalizedSku ? { sku: normalizedSku } : {}),
        ...(createCategoryId
          ? {
              category: {
                connect: { id: createCategoryId },
              },
            }
          : {}),
        images: processedImages, // Use the processed images
        ageGroup: ((validatedData as any).ageGroup ?? null) as any,
        metadata: productMetadata,
        slug,
        supplier: { connect: { id: supplier.id } },
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

    // Send notification emails to admin and supplier
    try {
      const { sendEmailViaUnifiedSystem } = await import(
        "@/lib/email/migration-helper"
      );
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const adminEmail = process.env.ADMIN_EMAIL || "admin@techtots.com";
      const supplierEmail = session.user.email as string | undefined;

      await sendEmailViaUnifiedSystem({
        to: adminEmail,
        subject: `New supplier product pending approval: ${product.name}`,
        html: `
          <p>A new product was submitted by supplier <strong>${supplier.companyName}</strong> and is pending approval.</p>
          <p><strong>Product:</strong> ${product.name}</p>
          <p><strong>SKU:</strong> ${product.sku || "—"}</p>
          <p><strong>Price:</strong> ${product.price} RON</p>
          <p><a href="${siteUrl}/admin/products">Review in Admin</a></p>
        `,
        text: `New supplier product pending approval: ${product.name} by ${supplier.companyName}. Review: ${siteUrl}/admin/products`,
      });

      if (supplierEmail) {
        await sendEmailViaUnifiedSystem({
          to: supplierEmail,
          subject: `We've received your product: ${product.name}`,
          html: `
            <p>Thank you for submitting <strong>${product.name}</strong>.</p>
            <p>Your product is now <strong>Pending Approval</strong>. Our team will review it within 48 hours. Once approved, it will be visible on the website.</p>
            <p>You can track and edit it in your dashboard: <a href="${siteUrl}/supplier/products">Supplier Products</a></p>
          `,
          text: `We've received your product ${product.name}. It is pending approval and will be reviewed within 48 hours. Track it at ${siteUrl}/supplier/products`,
        });
      }
    } catch (emailError) {
      console.error("Failed sending supplier product emails", emailError);
    }

    return NextResponse.json(
      {
        product,
        message: "Product created successfully",
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      }));

      return NextResponse.json(
        {
          error: "Validation error",
          message: "Please check your data and try again",
          details: formattedErrors,
          totalErrors: formattedErrors.length,
        },
        { status: 400 }
      );
    }

    console.error("Error creating supplier product:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}
