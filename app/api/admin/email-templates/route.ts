import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server/auth";

// Validation schema for creating/updating email templates
const EmailTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug too long"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long"),
  content: z.string().min(1, "Content is required"),
  variables: z.array(z.string()).default([]),
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category too long"),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

// Function to check admin authentication from both NextAuth and admin session cookie
async function checkAdminAuth(request: NextRequest) {
  console.log("🔐 [EMAIL-TEMPLATES] Checking admin authentication...");

  // First try NextAuth session
  console.log("🔍 [EMAIL-TEMPLATES] Checking NextAuth session...");
  const session = await auth();
  if (session?.user && session.user.role === "ADMIN") {
    console.log("✅ [EMAIL-TEMPLATES] NextAuth admin session found:", {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });
    return { isAdmin: true, user: session.user };
  }
  console.log("❌ [EMAIL-TEMPLATES] No NextAuth admin session found");

  // Then try admin session cookie
  console.log("🍪 [EMAIL-TEMPLATES] Checking admin session cookie...");
  const adminSessionCookie = request.cookies.get("admin-session");
  if (adminSessionCookie) {
    console.log(
      "🍪 [EMAIL-TEMPLATES] Admin session cookie found, verifying JWT..."
    );
    try {
      const decoded = jwt.verify(
        adminSessionCookie.value,
        process.env.NEXTAUTH_SECRET || "development-secret"
      ) as any;

      if (decoded.role === "ADMIN") {
        console.log("✅ [EMAIL-TEMPLATES] Admin session cookie verified:", {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        });
        return {
          isAdmin: true,
          user: {
            id: decoded.userId,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
          },
        };
      } else {
        console.log(
          "❌ [EMAIL-TEMPLATES] JWT decoded but user is not admin, role:",
          decoded.role
        );
      }
    } catch (error) {
      console.log(
        "❌ [EMAIL-TEMPLATES] JWT verification failed:",
        error instanceof Error ? error.message : String(error)
      );
    }
  } else {
    console.log("❌ [EMAIL-TEMPLATES] No admin session cookie found");
  }

  console.log("❌ [EMAIL-TEMPLATES] No valid admin authentication found");
  return { isAdmin: false, user: null };
}

// GET /api/admin/email-templates - List all email templates
export async function GET(request: NextRequest) {
  console.log("📧 [EMAIL-TEMPLATES] GET request received");

  try {
    const { isAdmin, user } = await checkAdminAuth(request);

    if (!isAdmin || !user) {
      console.log("❌ [EMAIL-TEMPLATES] Unauthorized access attempt");

      // Get session for debug info
      const session = await auth();
      return NextResponse.json(
        {
          error: "Unauthorized",
          debug:
            process.env.NODE_ENV === "development"
              ? {
                  hasSession: !!session,
                  hasUser: !!session?.user,
                  userRole: session?.user?.role,
                  hasAdminCookie: !!request.cookies.get("admin-session"),
                }
              : undefined,
        },
        { status: 401 }
      );
    }

    console.log(
      "✅ [EMAIL-TEMPLATES] Admin authentication successful, proceeding with template fetch"
    );

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search");

    console.log("🔍 [EMAIL-TEMPLATES] Query parameters:", {
      category,
      isActive,
      page,
      limit,
      search,
    });

    // Build where clause
    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    console.log("🔍 [EMAIL-TEMPLATES] Database query where clause:", where);

    // Get templates with pagination
    console.log("📊 [EMAIL-TEMPLATES] Executing database queries...");
    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          subject: true,
          category: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          variables: true,
          metadata: true,
        },
      }),
      prisma.emailTemplate.count({ where }),
    ]);

    console.log("📊 [EMAIL-TEMPLATES] Database queries completed:", {
      templatesCount: templates.length,
      totalCount: total,
    });

    // Debug logging for development
    if (process.env.NODE_ENV === "development") {
      console.log("Email templates API response:", {
        templatesCount: templates.length,
        total,
        page,
        limit,
        where,
      });
    }

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(
      "❌ [EMAIL-TEMPLATES] Error fetching email templates:",
      error
    );
    console.error("❌ [EMAIL-TEMPLATES] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-templates - Create new email template
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Debug logging for development
    if (process.env.NODE_ENV === "development") {
      console.log("Email template creation attempt:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        userRole: session?.user?.role,
        userId: session?.user?.id,
      });
    }

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Admin access required to create email templates",
          debug:
            process.env.NODE_ENV === "development"
              ? {
                  hasSession: !!session,
                  hasUser: !!session?.user,
                  userRole: session?.user?.role,
                }
              : undefined,
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = EmailTemplateSchema.parse(body);

    // Check if slug already exists
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: "Template with this slug already exists" },
        { status: 400 }
      );
    }

    // Create the template with metadata including images
    const bodyData = body as any; // Type assertion for images
    const template = await prisma.emailTemplate.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
        metadata: {
          images: bodyData.images || [],
          createdAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating email template:", error);
    return NextResponse.json(
      { error: "Failed to create email template" },
      { status: 500 }
    );
  }
}
