import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { utapi } from "@/lib/uploadthing";
import { sendSupplierMessageNotification } from "@/lib/admin-notifications";

// GET - List supplier messages
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category") || "";
    const priority = searchParams.get("priority") || "";
    const isRead = searchParams.get("isRead") || "";

    const where: any = { supplierId: supplier.id };

    if (category && category !== "ALL") {
      where.category = category;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }
    if (isRead === "true") {
      where.isRead = true;
    } else if (isRead === "false") {
      where.isRead = false;
    }

    const [messages, total] = await Promise.all([
      db.supplierMessage.findMany({
        where,
        skip: (page - 1) * limit,
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
        },
      }),
      db.supplierMessage.count({ where }),
    ]);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching supplier messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Send a new message
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
        contactPersonEmail: true,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const subject = formData.get("subject") as string;
    const content = formData.get("content") as string;
    const priority = formData.get("priority") as string;
    const category = formData.get("category") as string;
    const attachmentUrls = formData.getAll("attachmentUrls") as string[];
    const attachmentNames = formData.getAll("attachmentNames") as string[];
    const attachmentSizes = formData.getAll("attachmentSizes") as string[];

    if (!subject || !content) {
      return NextResponse.json(
        { error: "Subject and content are required" },
        { status: 400 }
      );
    }

    // Validate attachment URLs (they should be UploadThing URLs)
    const validAttachmentUrls = attachmentUrls.filter(
      url =>
        url &&
        typeof url === "string" &&
        (url.includes("uploadthing.com") || url.includes("utfs.io"))
    );

    // Create attachment objects with full information
    const attachments = validAttachmentUrls.map((url, index) => ({
      url,
      name: attachmentNames[index] || `File ${index + 1}`,
      size: parseInt(attachmentSizes[index] || "0"),
    }));

    // Create the message
    const message = await db.supplierMessage.create({
      data: {
        supplierId: supplier.id,
        senderId: session.user.id,
        senderType: "SUPPLIER",
        subject,
        content,
        priority: priority as any,
        category: category as any,
        attachments: validAttachmentUrls, // Keep URLs for backward compatibility
        attachmentDetails: attachments, // Store full attachment details as JSON
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send notification to admin team
    try {
      await sendSupplierMessageNotification({
        supplierName: supplier.contactPersonName || supplier.companyName,
        supplierEmail: supplier.contactPersonEmail || session.user.email || "",
        subject,
        content,
        priority,
        category,
        messageId: message.id,
        hasAttachments: validAttachmentUrls.length > 0,
        attachmentCount: validAttachmentUrls.length,
        attachments: attachments, // Pass the full attachment details
      });
    } catch (error) {
      console.error("Failed to send admin notification:", error);
      // Don't fail the message creation if notification fails
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error creating supplier message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
