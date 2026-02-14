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
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const assignedTo = searchParams.get("assignedTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: any = {};

    if (supplierId && supplierId !== "all") {
      where.supplierId = supplierId;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (priority && priority !== "all") {
      where.priority = priority;
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (assignedTo && assignedTo !== "all") {
      where.assignedTo = assignedTo === "unassigned" ? null : assignedTo;
    }

    // Fetch tickets with pagination
    const [tickets, total] = await Promise.all([
      db.supplierSupportTicket.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              companyName: true,
              name: true,
            },
          },
          assignedAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              responses: true,
            },
          },
          responses: {
            select: { createdAt: true },
            orderBy: { createdAt: "desc" as const },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.supplierSupportTicket.count({ where }),
    ]);

    // Transform tickets to match frontend expectations
    const transformedTickets = tickets.map(ticket => ({
      id: ticket.id,
      supplierId: ticket.supplierId,
      supplierName: ticket.supplier.companyName || ticket.supplier.name,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assignedTo: ticket.assignedTo,
      assignedAdminName:
        ticket.assignedAdmin?.name || ticket.assignedAdmin?.email,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      closedAt: ticket.closedAt,
      responseCount: ticket._count.responses,
      lastResponseAt: ticket.responses[0]?.createdAt ?? null,
    }));

    logger.info("Admin tickets retrieved", {
      adminId: session.user.id,
      totalTickets: total,
      filters: { supplierId, status, priority, category, assignedTo },
      page,
      limit,
    });

    return NextResponse.json({
      tickets: transformedTickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error retrieving admin tickets:", error);
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
      description,
      priority = "MEDIUM",
      category = "GENERAL",
      assignedTo,
    } = body;

    // Validate required fields
    if (!supplierId || !subject || !description) {
      return NextResponse.json(
        { error: "supplierId, subject, and description are required" },
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

    // Generate ticket number
    const ticketCount = await db.supplierSupportTicket.count();
    const ticketNumber = `TCK-${String(ticketCount + 1).padStart(6, "0")}`;

    // Create ticket
    const ticket = await db.supplierSupportTicket.create({
      data: {
        supplierId,
        ticketNumber,
        subject,
        description,
        priority,
        category,
        assignedTo: assignedTo || null,
      },
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            name: true,
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

    // Create initial response
    await db.supplierTicketResponse.create({
      data: {
        ticketId: ticket.id,
        responderId: session.user.id,
        responderType: "ADMIN",
        content: description,
        isInternal: false,
      },
    });

    // Transform response
    const transformedTicket = {
      id: ticket.id,
      supplierId: ticket.supplierId,
      supplierName: ticket.supplier.companyName || ticket.supplier.name,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assignedTo: ticket.assignedTo,
      assignedAdminName:
        ticket.assignedAdmin?.name || ticket.assignedAdmin?.email,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      closedAt: ticket.closedAt,
      responseCount: 1,
      lastResponseAt: ticket.createdAt,
    };

    logger.info("Admin support ticket created", {
      adminId: session.user.id,
      supplierId,
      supplierName: supplier.companyName || supplier.name,
      ticketId: ticket.id,
      ticketNumber,
      priority,
      category,
    });

    return NextResponse.json({
      success: true,
      message: "Support ticket created successfully",
      data: transformedTicket,
    });
  } catch (error) {
    logger.error("Error creating admin support ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
