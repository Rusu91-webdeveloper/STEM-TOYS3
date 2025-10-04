import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const supplierId = searchParams.get("supplierId");
    const status = searchParams.get("status"); // unread, read, all
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: any = {};

    if (supplierId && supplierId !== "all") {
      where.supplierId = supplierId;
    }

    if (status === "unread") {
      where.isRead = false;
    } else if (status === "read") {
      where.isRead = true;
    }

    if (priority && priority !== "all") {
      where.priority = priority;
    }

    if (category && category !== "all") {
      where.category = category;
    }

    // Fetch messages with pagination
    const [messages, total] = await Promise.all([
      db.supplierMessage.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              companyName: true,
              name: true,
            },
          },
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.supplierMessage.count({ where }),
    ]);

    // Transform messages to match frontend expectations
    const transformedMessages = messages.map(message => ({
      id: message.id,
      supplierId: message.supplierId,
      supplierName: message.supplier.companyName || message.supplier.name,
      senderId: message.senderId,
      senderName: message.sender.name || message.sender.email,
      senderType: message.senderType,
      subject: message.subject,
      content: message.content,
      isRead: message.isRead,
      readAt: message.readAt,
      priority: message.priority,
      category: message.category,
      attachments: message.attachments,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    }));

    logger.info("Admin messages retrieved", {
      adminId: session.user.id,
      totalMessages: total,
      filters: { supplierId, status, priority, category },
      page,
      limit,
    });

    return NextResponse.json({
      messages: transformedMessages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error retrieving admin messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      supplierId,
      subject,
      content,
      priority = "NORMAL",
      category = "GENERAL",
      attachments = [],
    } = body;

    // Validate required fields
    if (!supplierId || !subject || !content) {
      return NextResponse.json(
        { error: "supplierId, subject, and content are required" },
        { status: 400 }
      );
    }

    // Verify supplier exists
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, companyName: true, name: true },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Create message
    const message = await db.supplierMessage.create({
      data: {
        supplierId,
        senderId: session.user.id,
        senderType: "ADMIN",
        subject,
        content,
        priority,
        category,
        attachments,
      },
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            name: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform response
    const transformedMessage = {
      id: message.id,
      supplierId: message.supplierId,
      supplierName: message.supplier.companyName || message.supplier.name,
      senderId: message.senderId,
      senderName: message.sender.name || message.sender.email,
      senderType: message.senderType,
      subject: message.subject,
      content: message.content,
      isRead: message.isRead,
      readAt: message.readAt,
      priority: message.priority,
      category: message.category,
      attachments: message.attachments,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };

    logger.info("Admin message sent", {
      adminId: session.user.id,
      supplierId,
      supplierName: supplier.companyName || supplier.name,
      messageId: message.id,
      priority,
      category,
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      data: transformedMessage,
    });
  } catch (error) {
    logger.error("Error sending admin message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
