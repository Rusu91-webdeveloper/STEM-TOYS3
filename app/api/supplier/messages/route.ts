import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
        include: {
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
      select: { id: true, companyName: true },
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
    const attachments = formData.getAll("attachments") as File[];

    if (!subject || !content) {
      return NextResponse.json(
        { error: "Subject and content are required" },
        { status: 400 }
      );
    }

    // TODO: Handle file uploads to cloud storage
    const attachmentUrls: string[] = [];

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
        attachments: attachmentUrls,
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

    // TODO: Send notification to admin team
    // await sendAdminNotification({
    //   type: "NEW_SUPPLIER_MESSAGE",
    //   title: `New message from ${supplier.companyName}`,
    //   message: `Subject: ${subject}`,
    //   metadata: { messageId: message.id, supplierId: supplier.id },
    // });

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
