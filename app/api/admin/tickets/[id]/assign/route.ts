import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendTicketAssignmentNotification } from "@/lib/admin-notifications";

// GET - Get list of available admins for assignment
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Assign ticket to an admin
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const { assignedTo } = body;

    // Verify the ticket exists
    const ticket = await db.supplierSupportTicket.findUnique({
      where: { id: params.id },
      include: {
        supplier: {
          select: {
            companyName: true,
            contactPersonName: true,
          },
        },
        assignedAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
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

    // If assigning to a specific admin, verify they exist
    if (assignedTo) {
      const assignedAdmin = await db.user.findUnique({
        where: { id: assignedTo, role: "ADMIN" },
        select: { id: true, name: true, email: true },
      });

      if (!assignedAdmin) {
        return NextResponse.json(
          { error: "Assigned admin not found" },
          { status: 404 }
        );
      }

      // Update ticket assignment
      await db.supplierSupportTicket.update({
        where: { id: params.id },
        data: { assignedTo },
      });

      // Create an internal note about the assignment
      await db.supplierTicketResponse.create({
        data: {
          ticketId: params.id,
          responderId: session.user.id,
          responderType: "ADMIN",
          content: `Ticket assigned to ${assignedAdmin.name} (${assignedAdmin.email})`,
          isInternal: true,
        },
      });

      // Send notification to assigned admin
      try {
        await sendTicketAssignmentNotification({
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          assignedToName: assignedAdmin.name || "Admin",
          assignedToEmail: assignedAdmin.email,
          assignedByName: session.user.name || "Admin",
          assignedByEmail: session.user.email,
        });
      } catch (error) {
        console.error("Failed to send assignment notification:", error);
        // Don't fail the assignment if notification fails
      }
    } else {
      // Unassign ticket
      await db.supplierSupportTicket.update({
        where: { id: params.id },
        data: { assignedTo: null },
      });

      // Create an internal note about the unassignment
      await db.supplierTicketResponse.create({
        data: {
          ticketId: params.id,
          responderId: session.user.id,
          responderType: "ADMIN",
          content: "Ticket unassigned",
          isInternal: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: assignedTo ? "Ticket assigned successfully" : "Ticket unassigned successfully",
    });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
