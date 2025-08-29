import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendTicketResponseNotification } from "@/lib/admin-notifications";

// GET - Get all responses for a ticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const responses = await db.supplierTicketResponse.findMany({
      where: { ticketId: params.id },
      orderBy: { createdAt: "asc" },
      include: {
        responder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Error fetching ticket responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a new response to a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Verify the ticket exists
    const ticket = await db.supplierSupportTicket.findUnique({
      where: { id: params.id },
      include: {
        supplier: {
          select: {
            contactPersonEmail: true,
            companyName: true,
            contactPersonName: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const content = formData.get("content") as string;
    const isInternal = formData.get("isInternal") === "true";
    const attachmentUrls = formData.getAll("attachmentUrls") as string[];
    const attachmentNames = formData.getAll("attachmentNames") as string[];
    const attachmentSizes = formData.getAll("attachmentSizes") as string[];

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
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

    // Create the response
    const response = await db.supplierTicketResponse.create({
      data: {
        ticketId: params.id,
        responderId: session.user.id,
        responderType: "ADMIN",
        content,
        isInternal,
        attachments: validAttachmentUrls, // Keep URLs for backward compatibility
        attachmentDetails: attachments, // Store full attachment details as JSON
      },
      include: {
        responder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update ticket's updatedAt timestamp
    await db.supplierSupportTicket.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    // Update ticket status if not an internal note
    if (!isInternal) {
      await db.supplierSupportTicket.update({
        where: { id: params.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    // Send notification to supplier (only for non-internal responses)
    if (!isInternal) {
      try {
        await sendTicketResponseNotification({
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          responderName: session.user.name || "TechTots Support Team",
          responderEmail: ticket.supplier.contactPersonEmail || session.user.email || "",
          responderType: "ADMIN",
          content,
          isInternal,
          hasAttachments: validAttachmentUrls.length > 0,
          attachmentCount: validAttachmentUrls.length,
          attachments: attachments, // Pass the full attachment details
        });
      } catch (error) {
        console.error("Failed to send supplier notification:", error);
        // Don't fail the response creation if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Error creating ticket response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
