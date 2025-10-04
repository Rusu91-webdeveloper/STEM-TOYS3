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
    const type = searchParams.get("type");
    const status = searchParams.get("status"); // unread, read, all
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause
    const where: any = {};

    if (supplierId && supplierId !== "all") {
      where.supplierId = supplierId;
    }

    if (type && type !== "all") {
      where.type = type;
    }

    if (status === "unread") {
      where.isRead = false;
    } else if (status === "read") {
      where.isRead = true;
    }

    // Fetch notifications with pagination
    const [notifications, total] = await Promise.all([
      db.supplierNotification.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              companyName: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.supplierNotification.count({ where }),
    ]);

    // Transform notifications to match frontend expectations
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id,
      supplierId: notification.supplierId,
      supplierName:
        notification.supplier.companyName || notification.supplier.name,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      readAt: notification.readAt,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt,
    }));

    logger.info("Admin notifications retrieved", {
      adminId: session.user.id,
      totalNotifications: total,
      filters: { supplierId, type, status },
      page,
      limit,
    });

    return NextResponse.json({
      notifications: transformedNotifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error retrieving admin notifications:", error);
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
    const { supplierId, type, title, message, actionUrl } = body;

    // Validate required fields
    if (!supplierId || !type || !title || !message) {
      return NextResponse.json(
        { error: "supplierId, type, title, and message are required" },
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

    // Create notification
    const notification = await db.supplierNotification.create({
      data: {
        supplierId,
        type,
        title,
        message,
        actionUrl,
      },
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            name: true,
          },
        },
      },
    });

    // Transform response
    const transformedNotification = {
      id: notification.id,
      supplierId: notification.supplierId,
      supplierName:
        notification.supplier.companyName || notification.supplier.name,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      readAt: notification.readAt,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt,
    };

    logger.info("Admin notification created", {
      adminId: session.user.id,
      supplierId,
      supplierName: supplier.companyName || supplier.name,
      notificationId: notification.id,
      type,
      title,
    });

    return NextResponse.json({
      success: true,
      message: "Notification created successfully",
      data: transformedNotification,
    });
  } catch (error) {
    logger.error("Error creating admin notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
