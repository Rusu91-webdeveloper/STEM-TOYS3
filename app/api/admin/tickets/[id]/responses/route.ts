import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST - Add admin response to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const ticketId = params.id;
    const body = await request.json();
    const { content, isInternal = false, attachments = [] } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Response content is required" },
        { status: 400 }
      );
    }

    // Check if ticket exists
    const ticket = await db.supplierSupportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        supplierId: true,
        supplier: {
          select: {
            companyName: true,
            contactPersonEmail: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Create the response
    const response = await db.supplierTicketResponse.create({
      data: {
        ticketId,
        responderId: session.user.id,
        responderType: "ADMIN",
        content: content.trim(),
        isInternal,
        attachments,
      },
      select: {
        id: true,
        content: true,
        responderType: true,
        isInternal: true,
        attachments: true,
        createdAt: true,
        responder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update ticket status and timestamp
    const updateData: any = {
      updatedAt: new Date(),
    };

    // If this is a public response (not internal), update ticket status
    if (!isInternal) {
      updateData.status = "PENDING_CUSTOMER";
    }

    await db.supplierSupportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    // TODO: Send email notification to supplier if response is public
    // This will be implemented in the notification system

    return NextResponse.json({
      success: true,
      response,
      message: "Response added successfully",
    });
  } catch (error) {
    console.error("Error adding admin response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get all responses for a ticket (admin view)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const ticketId = params.id;

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    // Check if ticket exists
    const ticket = await db.supplierSupportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Get all responses for the ticket
    const responses = await db.supplierTicketResponse.findMany({
      where: { ticketId },
      select: {
        id: true,
        content: true,
        responderType: true,
        isInternal: true,
        attachments: true,
        createdAt: true,
        updatedAt: true,
        responder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
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
