import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import { applyStandardHeaders } from "@/lib/response-headers";

// Validation schemas
const sendMessageSchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  content: z.string().min(1, "Content is required").max(5000, "Content too long"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional().default("NORMAL"),
  category: z.enum(["GENERAL", "ACCOUNT", "ORDER", "SUPPORT", "MARKETING", "ANNOUNCEMENT"]).optional().default("GENERAL"),
});

const getMessagesSchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
  category: z.string().optional(),
  priority: z.string().optional(),
  isRead: z.string().optional(),
});

// GET - Retrieve chat messages for the authenticated user
export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = Object.fromEntries(searchParams.entries());
    const validatedQuery = getMessagesSchema.parse(query);

    const page = parseInt(validatedQuery.page);
    const limit = Math.min(parseInt(validatedQuery.limit), 100); // Cap at 100
    const skip = (page - 1) * limit;

    // 3. Build where clause based on user role
    let where: any = {};

    if (session.user.role === "SUPPLIER") {
      // Suppliers can only see messages sent to them
      const supplier = await db.supplier.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (!supplier) {
        return NextResponse.json(
          { error: "Supplier profile not found" },
          { status: 404 }
        );
      }

      where.supplierId = supplier.id;
    } else if (session.user.role === "ADMIN") {
      // Admins can see all messages
      // No additional where clause needed
    } else {
      // Regular users cannot access chat messages
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // 4. Apply additional filters
    if (validatedQuery.category && validatedQuery.category !== "ALL") {
      where.category = validatedQuery.category;
    }
    if (validatedQuery.priority && validatedQuery.priority !== "ALL") {
      where.priority = validatedQuery.priority;
    }
    if (validatedQuery.isRead === "true") {
      where.isRead = true;
    } else if (validatedQuery.isRead === "false") {
      where.isRead = false;
    }

    // 5. Fetch messages with pagination
    const [messages, total] = await Promise.all([
      db.supplierMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          subject: true,
          content: true,
          priority: true,
          category: true,
          isRead: true,
          readAt: true,
          createdAt: true,
          updatedAt: true,
          attachments: true,
          attachmentDetails: true,
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          supplier: {
            select: {
              id: true,
              companyName: true,
              contactPersonName: true,
            },
          },
        },
      }),
      db.supplierMessage.count({ where }),
    ]);

    // 6. Return response with proper headers
    const response = NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

    return applyStandardHeaders(response);
  } catch (error) {
    console.error("Error fetching chat messages:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}, {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // 100 requests per window
});

// POST - Send a new chat message
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // 3. Validate recipient exists and user has permission to message them
    const recipient = await db.supplier.findUnique({
      where: { id: validatedData.recipientId },
      select: {
        id: true,
        companyName: true,
        contactPersonName: true,
        contactPersonEmail: true,
      },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // 4. Check authorization - only admins can send messages to suppliers
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can send messages" },
        { status: 403 }
      );
    }

    // 5. Create the message
    const message = await db.supplierMessage.create({
      data: {
        supplierId: validatedData.recipientId,
        senderId: session.user.id, // This is the authenticated user's ID
        senderType: "ADMIN",
        subject: validatedData.subject,
        content: validatedData.content,
        priority: validatedData.priority,
        category: validatedData.category,
        attachments: [], // No attachments in basic chat
        attachmentDetails: [],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
            contactPersonName: true,
          },
        },
      },
    });

    // 6. Return success response
    const response = NextResponse.json({
      success: true,
      message,
    });

    return applyStandardHeaders(response);
  } catch (error) {
    console.error("Error sending chat message:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}, {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, // 50 requests per window (lower for POST)
});
