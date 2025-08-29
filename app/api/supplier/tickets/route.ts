import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendNewTicketNotification } from "@/lib/admin-notifications";

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

    const sp = request.nextUrl.searchParams;
    const page = parseInt(sp.get("page") || "1");
    const limit = parseInt(sp.get("limit") || "10");
    const status = sp.get("status") || "";
    const priority = sp.get("priority") || "";
    const category = sp.get("category") || "";

    const where: any = { supplierId: supplier.id };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const [tickets, total] = await Promise.all([
      db.supplierSupportTicket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          status: true,
          priority: true,
          category: true,
          attachments: true,
          attachmentDetails: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.supplierSupportTicket.count({ where }),
    ]);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const priority = formData.get("priority") as string;
    const attachmentUrls = formData.getAll("attachmentUrls") as string[];
    const attachmentNames = formData.getAll("attachmentNames") as string[];
    const attachmentSizes = formData.getAll("attachmentSizes") as string[];

    if (!subject || !description || !category) {
      return NextResponse.json(
        { error: "Subject, description and category are required" },
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

    const ticket = await db.supplierSupportTicket.create({
      data: {
        supplierId: supplier.id,
        subject,
        description,
        category: category as any,
        priority: (priority as any) || "MEDIUM",
        ticketNumber: `SUP-${Date.now()}`,
        attachments: validAttachmentUrls, // Keep URLs for backward compatibility
        attachmentDetails: attachments, // Store full attachment details as JSON
      },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        priority: true,
        category: true,
        attachments: true,
        attachmentDetails: true,
        createdAt: true,
      },
    });

    // Send notification to admin team
    try {
      await sendNewTicketNotification({
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject,
        description,
        priority: priority || "MEDIUM",
        category,
        supplierName: supplier.contactPersonName || supplier.companyName,
        supplierEmail: supplier.contactPersonEmail || session.user.email || "",
        hasAttachments: validAttachmentUrls.length > 0,
        attachmentCount: validAttachmentUrls.length,
        attachments: attachments, // Pass the full attachment details
      });
    } catch (error) {
      console.error("Failed to send admin notification:", error);
      // Don't fail the ticket creation if notification fails
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
